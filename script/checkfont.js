const fontkit = require('fontkit');
const path = require('path');

const font = fontkit.openSync(path.join(__dirname, '../assets', 'SDK_JP_Web_Heavy.ttf'));

console.log('Font family name:', font.familyName);
console.log('Full name:', font.fullName);
