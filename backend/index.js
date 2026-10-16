const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Подключение к базе в фоне без блокировки ответов сервера
const MONGO_URL = process.env.DATABASE_URL;
if (MONGO_URL) {
  mongoose.connect(MONGO_URL, {
    serverSelectionTimeoutMS: 3000
  }).then(() => {
    console.log('MongoDB connected');
  }).catch(err => {
    console.log('MongoDB connection error:', err);
  });
}

// Простые тестовые эндпоинты, которые гарантированно не упадут с ошибкой 500
app.get('/', (req, res) => {
  res.json({ status: 'ONLINE', message: 'CyberZone: Blackout API Connected' });
});

app.get('/api', (req, res) => {
  res.json({ status: 'ONLINE', message: 'CyberZone API Root' });
});

app.post('/api/auth', (req, res) => {
  const { telegramId, username } = req.body;
  res.json({
    success: true,
    player: {
      telegramId: telegramId || "58923411",
      username: username || "cyber_operator",
      resources: {
        energy: 150,
        parts: 450,
        food: 85,
        people: 12,
        stars: 150
      }
    }
  });
});

app.post('/api/base/upgrade-generator', (req, res) => {
  res.json({ success: true, currentEnergy: 180, message: 'Генератор успешно разогнан!' });
});

app.get('/api/pvp/find-target', (req, res) => {
  res.json({
    success: true,
    target: { name: "Убежище #4092", lvl: 2, energy: 90, parts: 210, food: 35 }
  });
});

app.post('/api/pvp/attack', (req, res) => {
  res.json({ success: true, message: 'Победа! Ресурсы захвачены.' });
});

app.post('/api/squad/hire', (req, res) => {
  res.json({ success: true, message: 'Боец успешно нанят.' });
});

app.post('/api/market/buy', (req, res) => {
  res.json({ success: true, message: 'Товар приобретен.' });
});

// Экспорт для Vercel
module.exports = app;
