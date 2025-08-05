const fs = require('fs');
const axios = require('axios');
const path = require('path');
const sharp = require('sharp');

const IDS_PATH = './ids_safe_or_q.json';
const OUTPUT_DIR = './downloads';
const MAX_DOWNLOAD = 1000;
const DELAY_MS = 500;
const sizeLimitBytes = 1 * 1024 * 1024;

// Tạo thư mục nếu chưa có
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

async function downloadAndCompressImage(id, index) {
  const url = `https://danbooru.donmai.us/posts/${id}.json`;

  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'FurinaImageDownloader/1.0' }
    });

    const post = res.data;
    const fileUrl = post.file_url;

    if (!fileUrl || post.has_video) {
      console.log(`⏭️ Bỏ qua ID ${id}: không có file_url hợp lệ hoặc là video`);
      return;
    }

    const extension = path.extname(fileUrl).split('?')[0];
    const filename = `${id}${extension}`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const imageRes = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageRes.data);

    fs.writeFileSync(filepath, buffer);
    console.log(`✅ (${index + 1}) Đã tải ảnh: ${filename}`);

    // Nén ảnh nếu cần
    const stats = fs.statSync(filepath);
    if (stats.size > sizeLimitBytes) {
      const baseName = path.basename(filename, extension);
      const tempOutput = path.join(OUTPUT_DIR, `__temp__${baseName}.jpg`);
      const finalOutput = path.join(OUTPUT_DIR, `${baseName}.jpg`);

      await sharp(filepath)
        .resize({ width: 1920 })
        .jpeg({ quality: 85 })
        .toFile(tempOutput);

      fs.unlinkSync(filepath);
      fs.renameSync(tempOutput, finalOutput);
      console.log(`🗜️ Ảnh nén: ${filename} -> ${baseName}.jpg`);
    }
  } catch (err) {
    console.warn(`❌ Lỗi khi tải/nén ảnh ID ${id}: ${err.message}`);
  }
}

async function main() {
  let ids = JSON.parse(fs.readFileSync(IDS_PATH, 'utf8'));
  ids = shuffleArray(ids).slice(0, MAX_DOWNLOAD);

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    await downloadAndCompressImage(id, i);
    await delay(DELAY_MS);
  }

  console.log(`🎉 Đã tải & nén xong ${MAX_DOWNLOAD} ảnh Furina!`);
}

main();
