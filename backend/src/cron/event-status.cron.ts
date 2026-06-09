import cron from 'node-cron';
import { Op } from 'sequelize';
import Event from '../models/Event';

// Chạy cron job mỗi phút
export const initCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // approved -> ongoing
      const eventsToStart = await Event.findAll({
        where: {
          status: 'approved',
          [Op.or]: [
            { startTime: { [Op.lte]: now } },
            { startDate: { [Op.lte]: now }, startTime: null }
          ]
        }
      });

      if (eventsToStart.length > 0) {
        await Promise.all(
          eventsToStart.map(event => event.update({ status: 'ongoing' }))
        );
        console.log(`[Cron] Marked ${eventsToStart.length} events as ongoing`);
      }

      // ongoing -> ended
      const eventsToEnd = await Event.findAll({
        where: {
          status: 'ongoing',
          [Op.or]: [
            { endTime: { [Op.lte]: now } },
            { endDate: { [Op.lte]: now }, endTime: null }
          ]
        }
      });

      if (eventsToEnd.length > 0) {
        await Promise.all(
          eventsToEnd.map(event => event.update({ status: 'ended' }))
        );
        console.log(`[Cron] Marked ${eventsToEnd.length} events as ended`);
      }

    } catch (error) {
      console.error('[Cron Error] Failed to update event statuses:', error);
    }
  });

  console.log('[Cron] Event status cron jobs initialized');
};
