// helpers/enhancePromptWithContext.js
const { loadLanguages } = require('../helpers/getLang');
const languages =loadLanguages()
const formatChatContext  = require('../helpers/formatChatContext')
function enhancePromptWithContext(systemPrompt, chatContext, message, languageCode) {
  const lang = languages[languageCode];
  const pc = lang.promptContext;
  let contextString = '';
  if (Array.isArray(chatContext)) {
    contextString = formatChatContext(chatContext, languageCode);
  } else if (typeof chatContext === 'string') {
    contextString = `\n\n${chatContext}`;
  } else {
    console.warn('[⚠] Dữ liệu chatContext không hợp lệ:', typeof chatContext);
  }

  const referenceInstructions = `\n\n${pc.header}\n${pc.instructions.join('\n')}`;

  return `${systemPrompt}${referenceInstructions}${contextString}\n\n${pc.currentMessage}: ${message}`;
}
module.exports= enhancePromptWithContext;