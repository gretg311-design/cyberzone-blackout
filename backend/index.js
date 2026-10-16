const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.DATABASE_URL;
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// 1. Настройка CORS и JSON
app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type'] 
}));
app.use(express.json());

// 2. Оптимизированное подключение к MongoDB для Vercel
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  if (!MONGO_URL) {
    console.warn('⚠️ DATABASE_URL не задана');
    return;
  }
  try {
    const db = await mongoose.connect(MONGO_URL, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB подключена');
  } catch (err) {
    console.error('❌ Ошибка MongoDB:', err.message);
  }
};

// Прослойка (middleware) для гарантированного подключения перед любым запросом
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// 3. Схема и модель пользователя
const UserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  gender: { type: String, default: 'male' },
  resources: {
    energy: { type: Number, default: 120 },
    parts: { type: Number, default: 450 },
    food: { type: Number, default: 85 },
    people: { type: Number, default: 12 },
    stars: { type: Number, default: 150 }
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// === РОУТЫ API ===

app.get('/', (req, res) => {
  res.json({ 
    status: 'ONLINE', 
    message: 'CyberZone: Blackout API Connected',
    dbState: isConnected ? 'CONNECTED' : 'DISCONNECTED'
  });
});

app.get('/api', (req, res) => {
  res.json({ status: 'ONLINE', message: 'CyberZone API Root' });
});

app.post('/api/auth', async (req, res) => {
  try {
    const { telegramId, username, gender } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, error: 'No ID' });

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({ telegramId, username: username || "operator", gender: gender || "male" });
      await user.save();
    }
    res.json({ success: true, player: user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/base/upgrade-generator', async (req, res) => {
  try {
    const { telegramId } = req.body;
    let user = await User.findOne({ telegramId });
    if (!user) return res.json({ success: true, currentEnergy: 140, message: 'Генератор разогнан (+20)' });

    user.resources.energy = Math.min(200, user.resources.energy + 20);
    await user.save();
    res.json({ success: true, currentEnergy: user.resources.energy, message: 'Генератор разогнан (+20)' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/pvp/find-target', (req, res) => {
  res.json({ 
    success: true, 
    target: { name: "Убежище #4092 [Sektor]", lvl: 2, energy: 90, parts: 210, food: 35 } 
  });
});

app.post('/api/pvp/attack', (req, res) => {
  res.json({ success: true, message: '🏆 Победа! Захвачены ресурсы.' });
});

app.post('/api/squad/hire', (req, res) => {
  res.json({ success: true, message: 'Боец нанят.' });
});

app.post('/api/market/buy', (req, res) => {
  res.json({ success: true, message: 'Товар куплен.' });
});

// Запуск для локальной разработки
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Порт: ${PORT}`));
}

// Обязательный экспорт для Vercel
module.exports = app;
