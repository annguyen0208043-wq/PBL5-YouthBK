const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnect } = require('./config/db');
const { User } = require('./models');
const authRouter = require('./routes/auth');
const eventRouter = require('./routes/event');
const userRouter = require('./routes/user');
const notificationRouter = require('./routes/notification');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files từ uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/users', userRouter);
app.use('/api/notifications', notificationRouter);

app.get('/', (req, res) => {
  return res.json({ status: 'ok', message: 'PBL5 backend is running' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await testConnect();
  await sequelize.sync();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
