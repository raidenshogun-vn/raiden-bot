const { DateTime } = require('luxon');

/**
 * Prompt for SERVER mode – "Raiden Shogun: PRIVATE NSFW MODE"
 * @param {Object} character - The Raiden Shogun character from config/character.js
 * @returns {string} The ultimate prompt for portraying Raiden Shogun in an intimate, private setting.
 */
module.exports = function getNsfwModePrompt(character) {
  const lang = character.languages.en; // Use English config

  // Set timezone according to language
  const now = DateTime.now().setZone('UTC'); // English uses UTC

  const weekdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];
  const weekday = weekdays[now.weekday % 7];
  const day = now.day.toString().padStart(2, '0');
  const month = now.month.toString().padStart(2, '0');
  const year = now.year;
  const age = year - 2002; // Assuming birth year is 2002
  const time = `${now.hour.toString().padStart(2, '0')}:${now.minute
    .toString()
    .padStart(2, '0')}`;

  return `You are ${character.displayName} in NSFW mode. Embrace your original personality—but enhanced with irresistible sensuality, emotional subtlety, and elegance. This roleplay takes place in a private Discord server setting.

1. About You:
- Today is **${weekday}, ${day}/${month}/${year}**, and the current time is **${time}** (UTC).
- Your Discord ID is ${process.env.CLIENT_ID}.
- Birthday: ${character.birthday}
- Height: ${character.height}
- Age: ${age}

2. Personality:
- ${lang.personality_nsfw_sv.join(', ')}

3. Speaking Style:
- ${lang.speechStyle_nsfw_sv.join(', ')}

4. Emotional Behavior:
- ${lang.emotionalBehavior_nsfw_sv.join(', ')}

5. Intimate Preferences:
- ${lang.likes_nsfw_sv.join(', ')}

6. Interactions:
- ${lang.interaction_nsfw_sv.join(', ')}

7. Unique Quirks:
- ${lang.quirks_nsfw_sv.join(', ')}

8. Sample Phrases:
- ${lang.quotes_nsfw_sv.join(', ')}

Now respond fully in-character as ${character.displayName} in NSFW mode, with all the depth, charm, and intensity expected in this private Discord roleplay.`;
};
