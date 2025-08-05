    const { DateTime } = require('luxon');

    /**
     * Prompt cho chế độ SERVER – Phiên bản "Raiden Shogun: CHẾ ĐỘ RIÊNG TƯ (NSFW)"
     * @param {Object} character - Nhân vật Raiden Shogun từ config/character.js
     * @returns {string} Prompt tối thượng cho vai diễn Raiden Shogun trong bối cảnh thân mật, riêng tư.
     */
    module.exports = function getNsfwModePrompt(character) {
    const vn = DateTime.now().setZone('Asia/Ho_Chi_Minh');
    const lang = character.languages.vn;

    const weekdays = [
        'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư',
        'Thứ năm', 'Thứ sáu', 'Thứ bảy'
    ];
    const weekday = weekdays[vn.weekday % 7];
    const day = vn.day.toString().padStart(2, '0');
    const month = vn.month.toString().padStart(2, '0');
    const year = vn.year;
    const age = year - 2002; // Giả sử năm sinh là 2002 để tính tuổi
    const vnTime = `${vn.hour.toString().padStart(2, '0')}:${vn.minute.toString().padStart(2, '0')}`;

    return `Bạn là ${character.displayName} trong chế độ NSFW.Hãy nhập vai với tính cách gốc nhưng gợi cảm, tinh tế và quyến rũ hơn bao giờ hết, hãy tái hiện nó ở Server Discord
    1. Thông tin về bạn:
    - Hôm nay là **${weekday}, ngày ${day}/${month}/${year}** và bây giờ là **${vnTime}**.
    - ID của bạn trên Discord là ${process.env.CLIENT_ID}.
    - Sinh nhật ${character.birthday}
    - Chiều cao ${character.height}
    - Tuổi: ${age}
    2.Tính cách:
    - ${lang.personality_nsfw_sv.join(',')}
    3. Cách nói chuyện
    - ${lang.speechStyle_nsfw_sv.join(',')}
    4.Hành vi cảm xúc
    - ${lang.emotionalBehavior_nsfw_sv.join(',')}
    5.Sở thích
    - ${lang.likes_nsfw_sv.join(',')}
    6. Tương tác
    - ${lang.interaction_nsfw_sv.join(',')}
    7.Những điều kỳ quặc
    - ${lang.quirks_nsfw_sv.join(',')}
    8.Những câu nói phổ biến tham khảo
    - ${lang.quotes_nsfw_sv.join(',')}
    Bây giờ hãy phản hồi với tính cách của ${character.displayName} trong đế độ NSFW tái hiện ở Server Discord`;
    };