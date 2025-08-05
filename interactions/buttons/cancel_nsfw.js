const { safeUpdate } = require('../../utils/interactionHelpers');
const { getLang } = require('../../helpers/getLang');
const User = require('../../models/User');
const fixUserMaps = require('../../helpers/fixUserMaps');

module.exports = async (interaction) => {
  const userId = interaction.user.id;
  let user = await User.findOne({ userId });
  if (!user) user = new User({ userId });
  fixUserMaps(user);

  const lang = getLang(user.language || 'vn').setMode;
  await safeUpdate(interaction, lang.cancelledNSFW, []);
};
