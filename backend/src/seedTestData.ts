import sequelize from './config/database';
import User from './models/User';
import Event from './models/Event';
import EventRegistration from './models/EventRegistration';
import { hashPassword } from './utils/passwordHelper';
import dotenv from 'dotenv';

dotenv.config();

const seedTestData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // 1. Find the Lien Chi user they are logged in as (khoacntt@pbl5.edu.vn)
    let creator = await User.findOne({ where: { email: 'khoacntt@pbl5.edu.vn' } });
    if (!creator) {
      // Fallback if not found
      creator = await User.findOne({ where: { role: 'lienchi' } });
    }
    if (!creator) {
      creator = await User.findOne({ where: { role: 'admin' } });
    }
    if (!creator) {
      throw new Error('No admin or lienchi user found to act as creator!');
    }
    console.log(`✅ Event creator will be: ${creator.name} (Email: ${creator.email}, ID: ${creator.id})`);

    // 2. Create or update the test user
    const studentEmail = 'user10@gmail.com';
    const studentPasswordPlain = '123456';
    const studentPasswordHash = await hashPassword(studentPasswordPlain);
    const studentId = '102230120';

    let testUser = await User.findOne({ where: { email: studentEmail } });
    if (testUser) {
      await testUser.update({
        password: studentPasswordHash,
        studentId: studentId,
        role: 'student',
        status: 'Hoạt động',
        isActive: true
      });
      console.log(`✅ Updated existing test user: ${studentEmail}`);
    } else {
      testUser = await User.create({
        name: 'Nguyễn Văn Mười',
        email: studentEmail,
        password: studentPasswordHash,
        role: 'student',
        studentId: studentId,
        phone: '0912345678',
        faculty: 'CNTT',
        department: '23T_Nhat1',
        status: 'Hoạt động',
        isActive: true,
        communityPoints: 0
      });
      console.log(`✅ Created new test user: ${studentEmail}`);
    }

    // 3. Delete old test registrations and events to avoid duplicates and FK errors
    const oldEvents = await Event.findAll({
      where: {
        title: [
          'Sự kiện GPS Test - Hoạt động ngoài trời',
          'Sự kiện GPS Attendance Test'
        ]
      }
    });
    
    if (oldEvents.length > 0) {
      const oldEventIds = oldEvents.map(e => e.id);
      await EventRegistration.destroy({
        where: { eventId: oldEventIds }
      });
      console.log(`✅ Deleted old registrations for event IDs: ${oldEventIds.join(', ')}`);
      
      await Event.destroy({
        where: { id: oldEventIds }
      });
      console.log('✅ Deleted old test events');
    }

    // 4. Create a sample ongoing event with GPS location
    const now = new Date();
    const plannedStartDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const plannedEndDate = new Date(now.getTime() + 4 * 60 * 60 * 1000);   // 4 hours from now
    const registrationDeadline = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

    // Centered at DUT (Da Nang University of Technology) Khu F
    const eventLat = 16.074061;
    const eventLng = 108.150720;
    const radius = 150; // 150 meters

    const ongoingEvent = await Event.create({
      title: 'Sự kiện GPS Attendance Test',
      description: 'Sự kiện mẫu đang diễn ra để thực hiện kiểm thử chức năng điểm danh bằng tọa độ GPS.',
      category: 'Học thuật',
      plannedStartDate,
      plannedEndDate,
      actualStartDate: plannedStartDate,
      registrationDeadline,
      locationName: 'Khu F, Trường Đại học Bách Khoa - ĐHĐN',
      locationLat: eventLat,
      locationLng: eventLng,
      attendanceRadius: radius,
      minParticipants: 1,
      maxParticipants: 100,
      currentSlots: 1,
      status: 'ongoing',
      createdBy: creator.id,
      createdByRole: creator.role === 'admin' ? 'admin' : 'lienchi',
      qrActive: true,
      communityPoints: 5
    });
    console.log(`✅ Created ongoing test event (ID: ${ongoingEvent.id})`);

    // 5. Register the test user for this event
    const registration = await EventRegistration.create({
      eventId: ongoingEvent.id,
      userId: testUser.id,
      status: 'registered',
      registrationDate: new Date()
    });
    console.log(`✅ Registered user ${studentEmail} for event ID ${ongoingEvent.id}`);

    console.log('\n──────────────────────────────────');
    console.log('TEST DATA SEEDING COMPLETE:');
    console.log(`- Creator:          ${creator.name} (Email: ${creator.email})`);
    console.log(`- Student Email:    ${studentEmail}`);
    console.log(`- Student Password: ${studentPasswordPlain}`);
    console.log(`- Ongoing Event ID: ${ongoingEvent.id}`);
    console.log(`- Coordinates:      ${eventLat}, ${eventLng}`);
    console.log(`- Radius:           ${radius}m`);
    console.log('──────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedTestData();
