const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 1. Переменные окружения
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.DATABASE_URL;
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// 2. Настройка CORS (чтобы GitHub Pages / локальный фронт стучался на бэк)
app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type'] 
}));
app.use(express.json());

// 3. Подключение к MongoDB
if (!MONGO_URL) {
  console.warn('⚠️ Внимание: DATABASE_URL не задана!');
} else {
  mongoose.connect(MONGO_URL)
    .then(() => console.log('✅ Успешное подключение к MongoDB'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));
}

// 4. Схема игрока в базе данных
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

const User = mongoose.model('User', UserSchema);

// === API ЭНДПОИНТЫ ДЛЯ ФРОНТЕНДА ===

// Проверка статуса сервера
app.get('/', (req, res) => {
  res.json({ 
    status: 'ONLINE', 
    message: 'CyberZone: Blackout API Connected',
    botActive: !!TG_BOT_TOKEN 
  });
});

// Регистрация / Авторизация при входе
app.post('/api/auth', async (req, res) => {
  try {
    const { telegramId, username, gender } = req.body;
    if (!telegramId || !username) {
      return res.status(400).json({ success: false, error: 'Недостаточно данных' });
    }

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({ telegramId, username, gender: gender || 'male' });
      await user.save();
    }

    res.json({ success: true, player: user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Форсаж генератора (+20 энергии)
app.post('/api/base/upgrade-generator', async (req, res) => {
  try {
    const { telegramId } = req.body;
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      // Фолбек если игрока еще нет в базе
      return res.json({ success: true, currentEnergy: 140, message: 'Генератор разогнан (+20 энергии)' });
    }

    user.resources.energy = Math.min(200, user.resources.energy + 20);
    await user.save();

    res.json({ 
      success: true, 
      currentEnergy: user.resources.energy, 
      message: 'Генератор успешно разогнан (+20 энергии)' 
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Поиск противника для ПвП-рейда
app.get('/api/pvp/find-target', (req, res) => {
  const enemiesPool = [
    { name: "Убежище #4092 [Sektor]", lvl: 2, energy: 90, parts: 210, food: 35 },
    { name: "Бункер «Омега» [Ghost]", lvl: 3, energy: 150, parts: 450, food: 80 },
    { name: "Цитадель «Ржавчина» [Rust]", lvl: 1, energy: 60, parts: 120, food: 20 },
    { name: "Терминал X [CyberLord]", lvl: 4, energy: 240, parts: 680, food: 120 }
  ];
  const target = enemiesPool[Math.floor(Math.random() * enemiesPool.length)];
  res.json({ success: true, target });
});

// Проведение ПвП атаки
app.post('/api/pvp/attack', async (req, res) => {
  res.json({ 
    success: true, 
    victory: true, 
    loot: { parts: 320, energy: 80 }, 
    message: '🏆 Победа! Захвачено: +320 деталей и +80 энергии.' 
  });
});

// Наем специалиста
app.post('/api/squad/hire', async (req, res) => {
  res.json({ success: true, message: 'Новый специалист успешно завербован.' });
});

// Покупка на Черном рынке
app.post('/api/market/buy', async (req, res) => {
  const { itemName, stars } = req.body;
  res.json({ success: true, message: `Приобретено: "${itemName}" за ⭐${stars}` });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
