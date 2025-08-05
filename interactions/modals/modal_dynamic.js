const User = require('../../models/User');
const { getLang } = require('../../helpers/getLang');

module.exports = async function(interaction) {
  try {
    // console.log(`[🧪] [Modal] Bắt đầu xử lý modal từ user ${interaction.user.id}`);

    const userId = interaction.user.id;
    const serverId = interaction.guildId;
    const source = interaction.channel.isDMBased() ? 'dm' : 'server';

    // ✅ Log tất cả fieldId xem có đúng 'situation_input' không
    // const fieldIds = [...interaction.fields.fields.keys()];
    // console.log(`[📋] Các field nhận được từ Modal: ${fieldIds.join(', ')}`);

    const situation = interaction.fields.getTextInputValue('situation_input');
    // console.log(`[📥] Nội dung tình huống nhận được: ${situation}`);

    let user = await User.findOne({ userId });
    console.log(user ? `[✅] Đã tìm thấy user ${userId}` : `[🆕] Chưa có user, tạo mới ${userId}`);
    if (!user) user = new User({ userId });

    if (source === 'dm') {
      user.dmSituation = situation;
      // user.markModified('dmSituation');
      // console.log(`[📌] Ghi vào dmSituation cho user ${userId}`);
    } else {
      user.serverSituations.set(serverId, situation);
    user.markModified('serverSituations'); // ✅ Cần có để đảm bảo save
      // console.log(`[📌] Ghi vào serverSituations cho user ${userId}, server ${serverId}`);
    }

    // ✅ Bọc user.save() riêng để log lỗi
    try {
      await user.save();
      // console.log(`[💾] Đã lưu user ${userId} vào MongoDB`);
    } catch (saveErr) {
      console.error(`❌ Lỗi khi save user ${userId}:`, saveErr);
    }

    // ✅ Kiểm tra ngôn ngữ trước khi dùng
    const langPack = getLang(user.language || 'vn');
    if (!langPack || !langPack.setMode) {
      console.error(`❌ Không tìm thấy lang.setMode cho '${user.language}'`);
      return await interaction.reply({
        content: '❌ Không tìm thấy ngôn ngữ phù hợp.',
        ephemeral: true,
      });
    }

    const lang = langPack.setMode;
    await interaction.reply({ content: lang.situationSaved, ephemeral: true });
    // console.log(`[✅] Đã gửi phản hồi Modal thành công cho ${userId}`);

  } catch (err) {
    console.error(`❌ [Modal] Lỗi khi xử lý modal DYNAMIC:`, err);

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: '❌ Đã xảy ra lỗi khi xử lý tình huống. Vui lòng thử lại sau.',
          ephemeral: true,
        });
      } catch (sendErr) {
        console.error('❌ Không thể gửi fallback reply:', sendErr);
      }
    }
  }
};
