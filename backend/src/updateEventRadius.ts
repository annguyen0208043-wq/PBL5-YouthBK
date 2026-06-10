import sequelize from './config/database';
import Event from './models/Event';

async function updateRadius() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const event = await Event.findOne({
      where: { title: 'Sự kiện GPS Attendance Test' }
    });
    
    if (event) {
      await event.update({ attendanceRadius: 2000 });
      console.log(`✅ Successfully updated event ID ${event.id} ("${event.title}") radius to 2000m (2km)`);
    } else {
      console.log('❌ Event "Sự kiện GPS Attendance Test" not found.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating radius:', error);
    process.exit(1);
  }
}

updateRadius();
