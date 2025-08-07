const promptModules = require('../../prompts');

async function getBasePrompt(language, mode = '', character) {
  const contextKey = 'DM';
  const modePrompts = promptModules?.[contextKey]?.[mode];

  // console.log('🔍 getBasePrompt_dm Debug:', {
  //   contextKey,
  //   mode,
  //   hasModePrompts: !!modePrompts,
  //   language,
  // });

  if (!modePrompts) {
    console.warn(`⚠️ Không tìm thấy mode "${mode}" trong context "${contextKey}"`);
    return null;
  }

  const promptFn = modePrompts[language];

  if (typeof promptFn === 'function') {
    const result = promptFn(character); 
    console.log('✅ Prompt function found and called (DM)');
    return result;
  }

  console.warn(`⚠️ Không tìm thấy function cho mode "${mode}" và language "${language}"`);
  return null; 
}

module.exports = getBasePrompt;
