import sequelize from './src/config/database';
import User from './src/models/User';
import Event from './src/models/Event';
import EventRegistration from './src/models/EventRegistration';

async function seed() {
  try {
    // Authenticate database
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 1. Find all student users
    const students = await User.findAll({ where: { role: 'student' } });
    if (students.length === 0) {
      console.log('No student users found. Creating a default student user "user1"...');
      // Create user1 student if not exists
      const newStudent = await User.create({
        name: 'user1',
        email: 'user1@example.com',
        password: '$2a$10$7zB/K9o2.F5o92B2x1q1be5e8f8g8h8i8j8k8l8m8n8o8p8q8r8s8', // dummy password hash
        role: 'student',
        studentId: '102210001',
        faculty: 'Khoa Công nghệ thông tin',
        isActive: true,
        status: 'Hoạt động'
      });
      students.push(newStudent);
    }

    console.log('Found students in database:');
    students.forEach(s => {
      console.log(`- ID: ${s.id}, Name: ${s.name}, Email: ${s.email}, StudentID: ${s.studentId}`);
    });

    // Find specifically 'user1' (by name or email or ID: 10)
    let targetStudent = students.find(s => s.name === 'user1' || s.email === 'user1@gmail.com' || s.id === 10);
    if (!targetStudent) {
      targetStudent = students[0];
    }
    console.log(`Target student chosen for test: ${targetStudent.name} (ID: ${targetStudent.id})`);

    // Find a Lien Chi / Admin to be the creator (specifically target 'khoacntt@pbl5.edu.vn')
    const creator = await User.findOne({ where: { email: 'khoacntt@pbl5.edu.vn' } });
    if (!creator) {
      throw new Error('No lienchi user found with email khoacntt@pbl5.edu.vn.');
    }
    console.log(`Event creator chosen: ${creator.name} (ID: ${creator.id})`);

    // 2. Create or update a test event
    const title = 'Sự kiện Chạy Thử Điểm Danh QR & GPS';
    
    // Check if event already exists
    let event = await Event.findOne({ where: { title } });
    
    const now = new Date();
    const plannedStartDate = new Date(now.getTime() - 3600000); // 1 hour ago
    const plannedEndDate = new Date(now.getTime() + 3600000 * 2); // 2 hours from now
    const registrationDeadline = new Date(now.getTime() - 1800000); // 30 minutes ago (expired!)

    if (event) {
      console.log(`Event "${title}" already exists. Updating it to ongoing...`);
      event.status = 'ongoing';
      event.qrActive = true;
      event.locationName = 'Nhà B1, Trường Đại học Bách Khoa - ĐHĐN';
      event.locationLat = 16.074061;
      event.locationLng = 108.150720;
      event.attendanceRadius = 100;
      event.registrationDeadline = registrationDeadline;
      event.plannedStartDate = plannedStartDate;
      event.plannedEndDate = plannedEndDate;
      event.actualStartDate = plannedStartDate;
      event.createdBy = creator.id;
      event.createdByRole = creator.role === 'admin' ? 'admin' : 'lienchi';
      if (!event.qrCode) {
        event.qrCode = 'BKYOUTH-TEST123';
      }
      await event.save();
    } else {
      console.log(`Creating new ongoing event "${title}"...`);
      event = await Event.create({
        title,
        description: 'Sự kiện chạy thử để kiểm thử toàn diện quy trình điểm danh tích hợp GPS và quét mã QR cá nhân sinh viên.',
        category: 'Học thuật',
        status: 'ongoing',
        qrActive: true,
        qrCode: 'BKYOUTH-TEST123',
        locationName: 'Nhà B1, Trường Đại học Bách Khoa - ĐHĐN',
        locationLat: 16.074061,
        locationLng: 108.150720,
        attendanceRadius: 100,
        registrationDeadline: registrationDeadline,
        plannedStartDate: plannedStartDate,
        plannedEndDate: plannedEndDate,
        actualStartDate: plannedStartDate,
        createdBy: creator.id,
        createdByRole: creator.role === 'admin' ? 'admin' : 'lienchi',
        currentSlots: 1
      });
    }

    console.log(`Event ready: ${event.title} (ID: ${event.id}), Status: ${event.status}, QR Active: ${event.qrActive}`);

    // 3. Register target student for this event
    const existingReg = await EventRegistration.findOne({
      where: { eventId: event.id, userId: targetStudent.id }
    });

    if (existingReg) {
      console.log(`Student "${targetStudent.name}" is already registered for this event. Status: ${existingReg.status}`);
      // If it was checked in, reset it to 'registered' so we can test check-in again!
      if (existingReg.status !== 'registered') {
        existingReg.status = 'registered';
        existingReg.attendedAt = null;
        existingReg.attendanceLat = null;
        existingReg.attendanceLng = null;
        await existingReg.save();
        console.log(`Reset registration status to "registered" to allow testing check-in.`);
      }
    } else {
      console.log(`Registering student "${targetStudent.name}" for the event...`);
      await EventRegistration.create({
        eventId: event.id,
        userId: targetStudent.id,
        status: 'registered',
        registrationDate: new Date()
      });
      // Increment event currentSlots
      event.currentSlots = (event.currentSlots || 0) + 1;
      await event.save();
      console.log(`Registered successfully.`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
