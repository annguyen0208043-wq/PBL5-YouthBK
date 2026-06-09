# PBL5 Backend - TypeScript

Backend cho hệ thống quản lý sự kiện đoàn viên thanh niên

## Tính năng

- ✅ Xác thực người dùng (JWT)
- ✅ Quản lý sự kiện
- ✅ Đăng ký sự kiện
- ✅ Quản lý người dùng
- ✅ Thông báo
- ✅ Chat/Conversation
- ✅ Hỗ trợ multiple roles (Admin, LienChi, Student)

## Stack Công Nghệ

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL + Sequelize ORM
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **Validation**: Express Validator

## Cài đặt

### 1. Clone và cài đặt dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### 2. Cấu hình environment

Sao chép file \`.env.example\` và tạo file \`.env\`:

\`\`\`bash
cp .env.example .env
\`\`\`

Chỉnh sửa các biến trong file \`.env\`:

\`\`\`
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pbl5_db
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
\`\`\`

### 3. Tạo database

\`\`\`bash
mysql -u root -p
CREATE DATABASE pbl5_db;
\`\`\`

## Chạy

### Development mode
\`\`\`bash
npm run dev
\`\`\`

### Build
\`\`\`bash
npm run build
\`\`\`

### Production mode
\`\`\`bash
npm run start
\`\`\`

## API Endpoints

### Authentication
- \`POST /api/auth/register\` - Đăng ký người dùng mới
- \`POST /api/auth/login\` - Đăng nhập
- \`POST /api/auth/logout\` - Đăng xuất

### Users
- \`GET /api/users/profile\` - Lấy thông tin cá nhân
- \`PUT /api/users/profile\` - Cập nhật thông tin cá nhân
- \`GET /api/users\` - Lấy danh sách tất cả người dùng (Admin only)
- \`GET /api/users/:id\` - Lấy thông tin người dùng theo ID

### Events
- \`GET /api/events\` - Lấy danh sách sự kiện
- \`GET /api/events/:id\` - Lấy thông tin sự kiện
- \`POST /api/events\` - Tạo sự kiện mới
- \`PUT /api/events/:id\` - Cập nhật sự kiện
- \`DELETE /api/events/:id\` - Xóa sự kiện
- \`POST /api/events/register\` - Đăng ký sự kiện

## Cấu trúc Folder

\`\`\`
src/
├── config/
│   └── database.ts         # Cấu hình database
├── controllers/            # Business logic
│   ├── authController.ts
│   ├── userController.ts
│   └── eventController.ts
├── models/                 # Database models
│   ├── User.ts
│   ├── Event.ts
│   ├── Message.ts
│   └── ...
├── routes/                 # API routes
│   ├── authRoutes.ts
│   ├── userRoutes.ts
│   └── eventRoutes.ts
├── middlewares/            # Express middlewares
│   └── authMiddleware.ts
├── utils/                  # Utility functions
│   ├── jwt.ts
│   └── passwordHelper.ts
└── index.ts               # Entry point
\`\`\`

## Roles

- **Admin**: Quản lý toàn hệ thống
- **LienChi**: Tạo và quản lý sự kiện
- **Student**: Người dùng thông thường, tham gia sự kiện

## License

MIT
