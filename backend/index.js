const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS (чтобы фронт с GitHub / локалки мог стучаться на бэк)
app.use(cors({
  origin: '*', // Для тестов разрешаем отовсюду. Потом можно заменить на 'https://твой-логин.github.io'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Базовый роут для проверки живой ли сервер
app.get('/', (req, res) => {
  res.json({ status: 'ONLINE', message: 'CyberZone: Blackout API is running' });
});

// 1. Авторизация / Регистрация игрока
app.post('/api/auth', (req, res) => {
  const { telegramId, username, gender } = req.body;
  
  // Здесь в будущем будет запись в PostgreSQL (через pg / prisma)
  console.log(`[AUTH] Игрок подключился: ID=${telegramId}, Ник=${username}, Пол=${gender}`);
  
  res.json({
    success: true,
    message: 'Оператор успешно зарегистрирован в сети',
    player: { telegramId, username, gender, energy: 120, parts: 450, food: 85 }
  });
});

// 2. Форсаж генератора (Экшен на базе)
app.post('/api/base/upgrade-generator', (req, res) => {
  const { telegramId } = req.body;
  // Логика добавления энергии
  res.json({
    success: true,
    message: 'Генератор успешно разогнан',
    addedEnergy: 20,
    currentEnergy: 140
  });
});

// 3. Поиск противника для ПвП-рейда (Clash of Clans стиль)
app.get('/api/pvp/find-target', (req, res) => {
  const enemiesPool = [
    { id: 1, name: "Убежище #4092 [Sektor]", lvl: 2, energy: 90, parts: 210, food: 35 },
    { id: 2, name: "Бункер «Омега» [Ghost]", lvl: 3, energy: 150, parts: 450, food: 80 },
    { id: 3, name: "Цитадель «Ржавчина» [Rust]", lvl: 1, energy: 60, parts: 120, food: 20 },
    { id: 4, name: "Терминал X [CyberLord]", lvl: 4, energy: 240, parts: 680, food: 120 }
  ];
  
  const randomEnemy = enemiesPool[Math.floor(Math.random() * enemiesPool.length)];
  res.json({ success: true, target: randomEnemy });
});

// 4. Проведение ПвП атаки
app.post('/api/pvp/attack', (req, res) => {
  const { attackerId, targetId } = req.body;
  // Здесь расчет победы/поражения
  res.json({
    success: true,
    victory: true,
    loot: { parts: 320, energy: 80 },
    message: 'Победа! Ресурсы вывезены на склад.'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`CyberZone Backend started on port ${PORT}`);
});
