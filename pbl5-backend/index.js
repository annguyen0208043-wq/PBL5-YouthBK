const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, testConnect } = require('./config/db');
const { User } = require('./models');
const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  return res.json({ status: 'ok', message: 'PBL5 backend is running' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await testConnect();
  await sequelize.sync({ alter: true });
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
