import sequelize from './config/database';
import User from './models/User';
import Event from './models/Event';
import EventRegistration from './models/EventRegistration';

const checkDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const events = await Event.findAll({
      attributes: ['id', 'title', 'status', 'createdBy', 'createdByRole'],
      raw: true
    });
    console.log('\n--- EVENTS IN DATABASE ---');
    console.log(events);

    const registrations = await EventRegistration.findAll({
      include: [
        { model: Event, attributes: ['title'] },
        { model: User, attributes: ['email', 'name', 'studentId'] }
      ]
    });
    console.log('\n--- REGISTRATIONS IN DATABASE ---');
    registrations.forEach(r => {
      const reg = r.toJSON() as any;
      console.log(`Reg ID: ${reg.id} | Event: [ID ${reg.eventId}] ${reg.Event?.title} | User: ${reg.User?.email} (${reg.User?.name}, MSSV: ${reg.User?.studentId}) | Status: ${reg.status}`);
    });

    const testUser = await User.findOne({ where: { email: 'user10@gmail.com' } });
    if (testUser) {
      console.log('\n--- TEST USER DETAILS ---');
      console.log(testUser.toJSON());
    } else {
      console.log('\n❌ Test user user10@gmail.com NOT found!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err);
    process.exit(1);
  }
};

checkDb();
