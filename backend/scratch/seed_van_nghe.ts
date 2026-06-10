import sequelize from '../src/config/database';
import User from '../src/models/User';
import Event from '../src/models/Event';
import EventRegistration from '../src/models/EventRegistration';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 1. Find or create the creator (Lien Chi CNTT user)
    let creator = await User.findOne({ where: { email: 'khoacntt@pbl5.edu.vn' } });
    if (!creator) {
      creator = await User.findOne({ where: { email: 'CNTT@gmail.com' } });
    }
    if (!creator) {
      creator = await User.findOne({ where: { role: 'lienchi' } });
    }
    if (!creator) {
      creator = await User.findOne({ where: { role: 'admin' } });
    }

    if (!creator) {
      console.log('No admin/lienchi user found to assign as creator.');
      process.exit(1);
    }
    console.log(`Using creator: ${creator.email} (ID: ${creator.id})`);

    // 2. Find student users: user1@gmail.com, user2@gmail.com, user3@gmail.com, user4@gmail.com
    const emails = ['user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com', 'user4@gmail.com'];
    const students: User[] = [];

    for (const email of emails) {
      const student = await User.findOne({ where: { email } });
      if (!student) {
        console.error(`Student user ${email} not found! Please ensure users are seeded.`);
        process.exit(1);
      }
      students.push(student);
    }

    // 3. Create/update the "Văn nghệ khoa CNTT" event
    const title = 'Văn nghệ khoa CNTT';
    let event = await Event.findOne({ where: { title } });

    const now = new Date();
    const plannedStartDate = new Date(now.getTime() - 86400000); // 1 day ago
    const plannedEndDate = new Date(now.getTime() + 86400000 * 30); // 30 days from now
    const registrationDeadline = new Date(now.getTime() - 3600000); // 1 hour ago (ended registration, ongoing status)

    const eventData = {
      title,
      description: 'Sự kiện giao lưu ca nhạc văn nghệ đặc sắc chào đón tân sinh viên khoa Công nghệ Thông tin.',
      category: 'Văn thể mỹ',
      status: 'ongoing' as const,
      qrActive: true,
      qrCode: 'VAN-NGHE-CNTT-QR',
      locationName: 'Trường Đại học Bách Khoa - ĐHĐN',
      locationLat: 16.074061,
      locationLng: 108.150720,
      attendanceRadius: 500, // 500 meters GPS radius
      registrationDeadline,
      plannedStartDate,
      plannedEndDate,
      actualStartDate: plannedStartDate,
      actualEndDate: null,
      createdBy: creator.id,
      createdByRole: creator.role === 'admin' ? ('admin' as const) : ('lienchi' as const),
      currentSlots: students.length,
    };

    if (event) {
      console.log(`Event "${title}" already exists. Updating details to ongoing...`);
      await event.update(eventData);
    } else {
      console.log(`Creating new ongoing event "${title}"...`);
      event = await Event.create(eventData);
    }
    console.log(`Event ready: ${event.title} (ID: ${event.id}), Status: ${event.status}, QR Code: ${event.qrCode}`);

    // 4. Register the students for this event
    for (const student of students) {
      const [registration, created] = await EventRegistration.findOrCreate({
        where: { eventId: event.id, userId: student.id },
        defaults: {
          status: 'registered',
          registrationDate: new Date()
        }
      });

      if (!created) {
        console.log(`Resetting registration status to "registered" for student: ${student.email}`);
        await registration.update({
          status: 'registered',
          attendedAt: null,
          attendanceLat: null,
          attendanceLng: null,
          confirmedBy: null,
          confirmedAt: null
        });
      } else {
        console.log(`Registered student: ${student.email}`);
      }
    }

    console.log('Successfully seeded the "Văn nghệ khoa CNTT" event and registered all 4 users!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
