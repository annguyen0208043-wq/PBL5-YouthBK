import sequelize from './src/config/database';
import User from './src/models/User';
import Event from './src/models/Event';
import EventRegistration from './src/models/EventRegistration';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 1. Get or create creator user (lienchi or admin)
    // We want to ensure we have a lienchi user from CNTT faculty so that it matches students
    let creator = await User.findOne({ where: { email: 'khoacntt@pbl5.edu.vn' } });
    if (!creator) {
      creator = await User.findOne({ where: { role: 'lienchi', faculty: 'CNTT' } });
    }
    if (!creator) {
      creator = await User.findOne({ where: { role: 'lienchi' } });
    }
    if (!creator) {
      creator = await User.findOne({ where: { role: 'admin' } });
    }
    
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    if (!creator) {
      console.log('No admin/lienchi user found. Creating default lienchi user "khoacntt@pbl5.edu.vn"...');
      creator = await User.create({
        name: 'Ban Tổ Chức Khoa CNTT',
        email: 'khoacntt@pbl5.edu.vn',
        password: hashedPassword,
        role: 'lienchi',
        faculty: 'CNTT',
        studentId: 'CNTT01',
        isActive: true,
        status: 'Hoạt động'
      });
    } else {
      // Ensure the creator has faculty set to CNTT so it is accessible by CNTT students
      creator.faculty = 'CNTT';
      await creator.save();
    }
    console.log(`Using creator: ${creator.email} (ID: ${creator.id}, Role: ${creator.role}, Faculty: ${creator.faculty})`);

    // 2. Find or create the 4 student users: user1@gmail.com, user2@gmail.com, user3@gmail.com, user4@gmail.com
    const emails = ['user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com', 'user4@gmail.com'];
    const students: User[] = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      let student = await User.findOne({ where: { email } });
      if (!student) {
        const name = `user${i + 1}`;
        let studentId = `10223010${i}`; // using 10223010x format
        // Check if studentId already exists
        const existingStudentId = await User.findOne({ where: { studentId } });
        if (existingStudentId) {
          studentId = `10223099${i}`;
        }
        console.log(`Creating student: ${email} with name: ${name}, studentId: ${studentId}`);
        student = await User.create({
          name,
          email,
          password: hashedPassword,
          role: 'student',
          studentId,
          faculty: 'CNTT',
          isActive: true,
          status: 'Hoạt động'
        });
      } else {
        console.log(`Student already exists: ${email} (ID: ${student.id})`);
        student.password = hashedPassword;
        student.isActive = true;
        student.status = 'Hoạt động';
        student.faculty = 'CNTT'; // Ensure all test students belong to 'CNTT'
        await student.save();
      }
      students.push(student);
    }

    // 3. Create or update an ongoing event
    const title = 'Sự kiện Điểm Danh Thử Nghiệm QR';
    let event = await Event.findOne({ where: { title } });

    const now = new Date();
    const plannedStartDate = new Date(now.getTime() - 86400000); // 1 day ago (already started)
    const plannedEndDate = new Date(now.getTime() + 86400000 * 365); // 1 year from now (not ended)
    const registrationDeadline = new Date(now.getTime() + 86400000 * 30); // 30 days from now

    const eventData = {
      title,
      description: 'Sự kiện đang diễn ra dùng để chạy thử tính năng quét mã QR và điểm danh GPS.',
      category: 'Học thuật',
      status: 'ongoing' as const,
      qrActive: true,
      qrCode: 'BKYOUTH-TEST-QR',
      locationName: 'Trường Đại học Bách Khoa - ĐHĐN',
      locationLat: 16.074061,
      locationLng: 108.150720,
      attendanceRadius: 500, // 500 meters to be safe for GPS tests
      registrationDeadline,
      plannedStartDate,
      plannedEndDate,
      actualStartDate: plannedStartDate,
      actualEndDate: null, // IMPORTANT: Reset actualEndDate to null so it doesn't get auto-ended!
      createdBy: creator.id,
      createdByRole: creator.role === 'admin' ? ('admin' as const) : ('lienchi' as const),
      currentSlots: students.length,
      revisionMessage: null,
      rejectionReason: null,
      belowMinAction: null,
      belowMinNote: null
    };

    if (event) {
      console.log(`Event "${title}" already exists. Updating details and status to ongoing...`);
      await event.update(eventData);
    } else {
      console.log(`Creating new ongoing event "${title}"...`);
      event = await Event.create(eventData);
    }
    console.log(`Event ready: ${event.title} (ID: ${event.id}), Status: ${event.status}, QR Code: ${event.qrCode}`);

    // 4. Register these students for this event
    for (const student of students) {
      const existingReg = await EventRegistration.findOne({
        where: { eventId: event.id, userId: student.id }
      });

      if (existingReg) {
        console.log(`Student "${student.email}" is already registered. Resetting status to "registered" for testing check-in...`);
        await existingReg.update({
          status: 'registered',
          attendedAt: null,
          attendanceLat: null,
          attendanceLng: null,
          confirmedBy: null,
          confirmedAt: null
        });
      } else {
        console.log(`Registering student "${student.email}"...`);
        await EventRegistration.create({
          eventId: event.id,
          userId: student.id,
          status: 'registered',
          registrationDate: new Date()
        });
      }
    }

    console.log('Seeding completed successfully! You can now test QR scanning.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
