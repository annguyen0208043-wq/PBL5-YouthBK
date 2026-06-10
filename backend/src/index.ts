import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import sequelize from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import eventRoutes from './routes/eventRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import certificateRoutes from './routes/certificateRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { registerChatSocket } from './sockets/chatSocket';
import { initCronJobs } from './cron/event-status.cron';


// Import models để đảm bảo associations được thiết lập
import './models/User';
import './models/Event';
import './models/EventRegistration';
import './models/EventTimeline';
import './models/EventTimelineDetail';
import './models/EventImage';
import './models/EventDocument';
import './models/EventApproval';
import './models/Notification';
import './models/NotificationRecipient';
import './models/Certificate';
import './models/Conversation';
import './models/ConversationMember';
import './models/ChatInvitation';
import './models/Message';
import './models/AuditLog';
import './models/EventFeedback';
import './models/CommunityPointHistory';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
registerChatSocket(httpServer);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files - serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running' });
});


// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Global Error Handler:', err);
  res.status(err.status || 400).json({
    message: err.message || 'Lỗi server nội bộ'
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Avoid automatic schema alterations by default (can enable with DB_AUTO_ALTER=true)
    if (process.env.DB_AUTO_ALTER === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized (alter)');
    } else {
      await sequelize.sync(); // Bypasses the Sequelize alter:true bug in MySQL
      console.log('Database models synchronized');
    }

    initCronJobs();

    httpServer.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
