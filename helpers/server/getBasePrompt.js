const promptModules = require('../../prompts');
async function getBasePrompt(language, mode = '',character) {
  const contextKey = 'SERVER';
  const modePrompts = promptModules?.[contextKey]?.[mode];

  console.log('🔍 getBasePrompt (SERVER) Debug:', {
    contextKey,
    mode,
    hasModePrompts: !!modePrompts,
    language,
  });

  if (!modePrompts) {
    console.warn(`⚠️ Không tìm thấy mode "${mode}" trong context "${contextKey}"`);
    return null; // ❌ Không fallback
  }

  const promptFn = modePrompts[language];
  if (typeof promptFn === 'function') {
  
    const result = promptFn(character);
    console.log('✅ Prompt function found and called (SERVER)');
    return result;
  }
  console.log('📦 modePrompts:', modePrompts);
  console.log('📦 promptFn:', promptFn);


  console.warn(`⚠️ promptFn không hợp lệ hoặc không phải function | type: ${typeof promptFn}`);
  return null; // ❌ Không fallback nếu function không đúng
}

module.exports = getBasePrompt;
