const fs = require('fs');
const axios = require('axios');

const TAG = 'raiden_shogun';
const LIMIT = 100;
const MAX_PAGES = 60; // Tuỳ chỉnh nếu muốn
const DELAY_MS = 1000;
const OUTPUT_PATH = './ids_safe_or_q.json';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(page) {
  const url = `https://danbooru.donmai.us/posts.json?limit=${LIMIT}&page=${page}&tags=${encodeURIComponent(TAG)}`;
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'FurinaDownloader/1.0' }
    });
    return res.data;
  } catch (err) {
    console.warn(`⏳ Retry sau lỗi ở trang ${page}: ${err.message}`);
    await delay(2000);
    return fetchPage(page);
  }
}

async function fetchAllIds() {
  const allIds = new Set();
  let totalSizeEstimate = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const posts = await fetchPage(page);

    if (!posts || posts.length === 0) {
      console.log(`✅ Hết dữ liệu tại trang ${page}, dừng lại.`);
      break;
    }

    let validCount = 0;

    for (const post of posts) {
      const isSafeOrQuestionable = post.rating === 's' || post.rating === 'q';
      const fileUrl = post.file_url || '';
      const fileExt = (post.file_ext || '').toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png','gif'].includes(fileExt);
      const isValid = fileUrl && !post.has_video && isImage;

      if (isSafeOrQuestionable && isValid) {
        if (!allIds.has(post.id)) {
          allIds.add(post.id);
          totalSizeEstimate += post.file_size || 0;
          validCount++;
        }
      }
    }

    console.log(`📦 Trang ${page}: ${validCount} ảnh (s + q), tổng cộng ${allIds.size} ID`);
    await delay(DELAY_MS);
  }

  const idsArray = Array.from(allIds);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(idsArray, null, 2));

  console.log(`🎉 Hoàn tất! Đã lấy ${idsArray.length} ảnh (rating s + q) => Ghi vào ${OUTPUT_PATH}`);

  const sizeGB = (totalSizeEstimate / (1024 ** 3)).toFixed(2);
  console.log(`📊 Ước tính tổng dung lượng tải về: ~${sizeGB} GB`);
}

fetchAllIds();
