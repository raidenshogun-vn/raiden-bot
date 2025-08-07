const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { QuotaLog } = require('../models/QuotaLog');
const character = require('../config/character');
const { loadLanguages } = require('../helpers/getLang');
const winston = require('winston');
const pLimit = require('p-limit').default;
const languages = loadLanguages();

// Logger config
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

// ===== Configuration =====
const FREE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite-preview-06-17',
  'gemini-2.5-flash'
];
const RETRY_OPTIONS = {
  attempts: 3,
  minDelayMs: 500,
  maxDelayMs: 2000
};

const CONCURRENCY_LIMIT = 10;
const limit = pLimit(CONCURRENCY_LIMIT);

// ===== Load API Keys =====
const GEMINI_API_KEYS = Object.entries(process.env)
  .filter(([k]) => k.startsWith('AUTO_'))
  .map(([, v]) => v)
  .filter(Boolean);

if (!GEMINI_API_KEYS.length) {
  throw new Error('⚠️ Không có API key nào.');
}

// ===== API Key Manager (Round-robin) =====
class ApiKeyManager {
  constructor(keys) {
    this.pool = keys.map(k => ({ key: k, cooldownUntil: 0 }));
    this.index = 0;
  }

  getNextKey() {
    const now = Date.now();
    const n = this.pool.length;

    for (let i = 0; i < n; i++) {
      const idx = (this.index + i) % n;
      const entry = this.pool[idx];
      if (entry.cooldownUntil <= now) {
        this.index = (idx + 1) % n;
        return entry;
      }
    }

    return null;
  }

  setCooldown(entry, seconds) {
    entry.cooldownUntil = Date.now() + seconds * 1000;
  }
}

const apiKeyManager = new ApiKeyManager(GEMINI_API_KEYS);

// ===== Model Cache =====
const modelCache = new Map();

function getCachedModel(apiKey, modelId, maxTokens, customTemp) {
  const cacheKey = `${apiKey}::${modelId}::${maxTokens}::${customTemp ?? 'default'}`;
  if (modelCache.has(cacheKey)) return modelCache.get(cacheKey);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(customTemp !== undefined && { temperature: customTemp })
    }
  });

  // console.log(`📡 [Model Init] model=${modelId}, key=...${apiKey.slice(-4)}, temperature=${customTemp ?? 'default'}`);
  modelCache.set(cacheKey, model);
  return model;
}

// ===== Retry with backoff =====
async function retryWithBackoff(fn, options = RETRY_OPTIONS) {
  const { attempts, minDelayMs, maxDelayMs } = options;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      const delay = Math.min(minDelayMs * 2 ** i, maxDelayMs);
      const jitter = Math.random() * delay * 0.3;
      const wait = delay + jitter;
      logger.warn(`⏳ Retry #${i + 1} in ${Math.round(wait)}ms`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// ===== Core logic (SECURE version) =====
async function generateResponseInternal(
  prompt,
  systemPrompt,
  language = 'vn',
  userId = null,
  username = null,
  displayName = null,
  overrideMaxTokens = null
) {
  const langObj = languages[language] || languages.vn;
  const note ='IMPORTANT: You MUST respond only in the correct language.';

  // Get maxTokens
const maxTokens = overrideMaxTokens || 2000;
  // Get user temperature setting
const customTemp = 1;

  for (const modelId of FREE_MODELS) {
    let attemptsPerModel = 0;
    while (attemptsPerModel < apiKeyManager.pool.length) {
      const keyEntry = apiKeyManager.getNextKey();
      if (!keyEntry) {
        throw new Error('🚫 Tất cả API key đều đang cooldown. Vui lòng thử lại sau.');
      }

      try {
        const model = getCachedModel(keyEntry.key, modelId, maxTokens, customTemp);

        // const finalPrompt = {
        //   systemInstruction: {
        //     role: 'system',
        //     parts: [{ text: systemPrompt }]
        //   },
        //   contents: [
        //     {
        //       role: 'user',
        //       parts: [{ text: `${note}\n${displayName}: ${prompt}\n${character.displayName}:` }]
        //     }
        //   ]
        // };

        // logger.info('📤 Gemini Prompt Sent:');
        // logger.info(JSON.stringify(finalPrompt, null, 2));

        const response = await retryWithBackoff(() =>
          model.generateContent({
            systemInstruction: {
              role: 'system',
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: `${note}\n\nUser: ${prompt}` }]
              }
            ]
          })
        );

        let text = response.response.text();

        // Lọc emoji (Unicode)
        text = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
        // Lọc promptContext khỏi câu trả lời
          const contextLines = [
            langObj?.promptContext?.header,
            ...(langObj?.promptContext?.instructions || []),
            langObj?.promptContext?.historyHeader
          ].filter(Boolean);

          for (const line of contextLines) {
            if (!line) continue;
            const escapedLine = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`^\\s*${escapedLine}\\s*$`, 'gm');
            text = text.replace(regex, '');
          }

          text = text.replace(/^\s*\n/gm, '').trim();
          
          const nameRegex = new RegExp(`^\\s*(Character|${character.displayName}|[\\wÀ-Ỹà-ỹ]+):\\s*`, 'gm');
          text = text.replace(nameRegex, '');

           
               // ===== [MỚI] BỘ LỌC REGEX NÂNG CAO (Xử lý Stuttering) =====
        // Chiến lược: Bảo vệ -> Thanh trừng -> Khôi phục.

        // BƯỚC 1: BẢO VỆ các trường hợp "lắp bắp" hợp lệ (ví dụ: "em... em").
        // Ta tìm các mẫu "word...word" (không phân biệt hoa thường) và thay thế dấu "..."
        // bằng một placeholder đặc biệt để chúng không bị xóa ở bước sau.
        const STUTTER_PLACEHOLDER = '___STUTTER___';
        // Regex giải thích:
        // (\w+): Bắt lấy một từ (group 1).
        // \s*\.{3,}\s*: Dấu ba chấm và các khoảng trắng xung quanh.
        // \1: Backreference, đảm bảo từ tiếp theo phải GIỐNG HỆT từ trong group 1.
        // /gi: g = global (toàn bộ văn bản), i = case-insensitive (không phân biệt hoa thường).
        text = text.replace(/(\w+)\s*\.{3,}\s*(\1)/gi, `$1${STUTTER_PLACEHOLDER}$2`);

        // BƯỚC 2: THANH TRỪNG tất cả các dấu "..." còn lại (lỗi lạm dụng).
        // Vì các trường hợp hợp lệ đã được bảo vệ, giờ ta có thể xóa phần còn lại một cách an toàn.
        // Biến "từ... từ khác" thành "từ từ khác".
        text = text.replace(/\s*\.{3,}\s*/g, ' ');
        // Biến "câu..." ở cuối thành "câu."
        text = text.replace(/(?<=\w)\s*\.{3,}/g, '.');

        // BƯỚC 3: KHÔI PHỤC các trường hợp "lắp bắp" đã được bảo vệ.
        // Đổi placeholder trở lại thành dấu "..." chuẩn.
        text = text.replace(new RegExp(STUTTER_PLACEHOLDER, 'g'), '... ');

        // BƯỚC 4: Dọn dẹp cuối cùng sau tất cả các bước thay thế.
        // Loại bỏ khoảng trắng thừa trước dấu câu.
        text = text.replace(/\s+([.,;?!])/g, '$1');
        // Đảm bảo chỉ có một khoảng trắng giữa các từ.
        text = text.replace(/\s+/g, ' ');
        // Lọc prompt leak (optional nhưng khuyến khích)
        const promptLeakPatterns = [
          /remember:/i,
          /you are the main character/i,
          /never reveal/i,
          /stick to your assigned role/i,
          /system prompt/i
        ];
        if (promptLeakPatterns.some(rx => rx.test(text))) {
          throw new Error('🛑 Gemini response leaked internal prompt!');
        }

        logger.info(`✅ Success: model=${modelId}, key=...${keyEntry.key.slice(-4)}`);

        if (userId && username) {
          await QuotaLog.create({ userId, username, model: modelId, timestamp: new Date() });
        }

        return text;
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('429')) {
          const match = msg.match(/"retryDelay":"(\d+)s"/);
          const sec = match ? parseInt(match[1], 10) : 30;
          apiKeyManager.setCooldown(keyEntry, sec);
          logger.warn(`⚠️ Key ...${keyEntry.key.slice(-4)} cooldown ${sec}s`);
          attemptsPerModel++;
          continue;
        }

        logger.error(`❌ Error: model=${modelId}, key=...${keyEntry.key.slice(-4)}, error=${msg}`);
        break;
      }
    }

    logger.warn(`⚠️ Model ${modelId} failed on all keys. Trying next model.`);
  }

  throw new Error('❌ Tất cả model free đều hết quota hoặc lỗi.');
}


// ===== Export với giới hạn đồng thời =====
module.exports = {
  generateResponse: (...args) =>
    limit(() => {
      if (limit.pendingCount > 5) {
        logger.warn(`🚦 Đang có ${limit.pendingCount} request chờ xử lý...`);
      }
      return generateResponseInternal(...args);
    })
};
