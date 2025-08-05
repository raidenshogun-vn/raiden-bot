require('dotenv').config(); // 🔁 Load biến môi trường từ .env
const mongoose = require('mongoose');
const User = require('../models/User'); // Đường dẫn đến model User

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  try {
    if (!MONGO_URI) throw new Error('⚠️ MONGO_URI is not defined in .env');

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const result = await User.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📊 Number of users by language:');
    result.forEach(item => {
      console.log(`- ${item._id}: ${item.count}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  } finally {
    mongoose.disconnect();
  }
}

main();
