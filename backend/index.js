const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Настройка CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Подключение к MongoDB
const MONGO_URL = process.env.DATABASE_URL;

let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) return;
  if (!MONGO_URL) return;
  try {
    const db = await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
    isConnected = db.connections[0].readyState === 1;
  } catch (err) {
    console.error('Mongo connection error:', err);
  }
};

app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Модель игрока
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String, default: 'operator' },
  resources: {
    energy: { type: Number, default: 120 },
    parts: { type: Number, default: 450 },
    food: { type: Number, default: 85 },
    people: { type: Number, default: 12 },
    stars: { type: Number, default: 150 }
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// === РОУТЫ ===

// Базовая проверка работы сервера
app.get('/', (req, res) => {
  res.json({ status: 'ONLINE', message: 'CyberZone: Blackout API Connected' });
});

app.get('/api', (req, res) => {
  res.json({ status: 'ONLINE', message: 'CyberZone API Root' });
});

// Авторизация / Получение данных
app.post('/api/auth', async (req, res) => {
  try {
    const { telegramId, username } = req.body;
    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'No Telegram ID provided' });
    }

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({ telegramId, username: username || "operator" });
      await user.save();
    }
    res.json({ success: true, player: user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Апгрейд генератора
app.post('/api/base/upgrade-generator', async (req, res) => {
  try {
    const { telegramId } = req.body;
    let user = await User.findOne({ telegramId });
    if (user) {
      user.resources.energy = Math.min(200, user.resources.energy + 20);
      await user.save();
      return res.json({ success: true, currentEnergy: user.resources.energy, message: 'Генератор разогнан (+20 Энергии)' });
    }
    res.json({ success: true, currentEnergy: 140, message: 'Генератор разогнан' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Поиск PVP целей
app.get('/api/pvp/find-target', (req, res) => {
  res.json({
    success: true,
    target: { name: "Убежище #4092 [Sektor]", lvl: 2, energy: 90, parts: 210, food: 35 }
  });
});

app.post('/api/pvp/attack', (req, res) => {
  res.json({ success: true, message: '🏆 Победа! Ресурсы захвачены.' });
});

app.post('/api/squad/hire', (req, res) => {
  res.json({ success: true, message: 'Боец успешно нанят.' });
});

app.post('/api/market/buy', (req, res) => {
  res.json({ success: true, message: 'Товар приобретен.' });
});

// Экспорт только приложения без listen()
module.exports = app;
