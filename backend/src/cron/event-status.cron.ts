import cron from 'node-cron';
import { Op } from 'sequelize';
import Event from '../models/Event';

// Chạy cron job mỗi phút
export const initCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // 1. check registrationDeadline passed and below minParticipants
      // open_registration / revision_required -> below_minimum
      const eventsBelowMin = await Event.findAll({
        where: {
          status: {
            [Op.in]: ['open_registration', 'revision_required']
          },
          registrationDeadline: {
            [Op.lte]: now
          },
          minParticipants: {
            [Op.gt]: sequelize.col('currentSlots') // currentSlots < minParticipants
          }
        }
      });

      if (eventsBelowMin.length > 0) {
        await Promise.all(
          eventsBelowMin.map(event => event.update({ status: 'below_minimum' }))
        );
        console.log(`[Cron] Marked ${eventsBelowMin.length} events as below_minimum`);
      }

      // 2. start events when planned/actual start date is reached (and they are not below minimum or are already allowed to proceed)
      // open_registration / revision_required -> ongoing
      // Condition: registrationDeadline passed, slots >= minParticipants, start time reached
      // Wait, what if registrationDeadline is null? Then it check actualStartDate || plannedStartDate
      const eventsToStart = await Event.findAll({
        where: {
          status: {
            [Op.in]: ['open_registration', 'revision_required']
          },
          [Op.and]: [
            // Started condition: (actualStartDate <= now) or (actualStartDate is null and plannedStartDate <= now)
            {
              [Op.or]: [
                { actualStartDate: { [Op.lte]: now } },
                {
                  [Op.and]: [
                    { actualStartDate: null },
                    { plannedStartDate: { [Op.lte]: now } }
                  ]
                }
              ]
            },
            // Meets min condition OR minParticipants is null OR registrationDeadline has not passed yet?
            // Usually, once start time is reached, we check if slots >= minParticipants.
            {
              [Op.or]: [
                { minParticipants: null },
                { minParticipants: { [Op.lte]: sequelize.col('currentSlots') } }
              ]
            }
          ]
        }
      });

      if (eventsToStart.length > 0) {
        await Promise.all(
          eventsToStart.map(event => {
            const actualStart = event.actualStartDate || now;
            return event.update({
              status: 'ongoing',
              actualStartDate: event.actualStartDate ? event.actualStartDate : actualStart
            });
          })
        );
        console.log(`[Cron] Marked ${eventsToStart.length} events as ongoing`);
      }

      // 3. ongoing -> ended
      // Condition: actualEndDate <= now or (actualEndDate is null and plannedEndDate <= now)
      const eventsToEnd = await Event.findAll({
        where: {
          status: 'ongoing',
          [Op.or]: [
            { actualEndDate: { [Op.lte]: now } },
            {
              [Op.and]: [
                { actualEndDate: null },
                { plannedEndDate: { [Op.lte]: now } }
              ]
            }
          ]
        }
      });

      if (eventsToEnd.length > 0) {
        await Promise.all(
          eventsToEnd.map(event => {
            const actualEnd = event.actualEndDate || now;
            return event.update({
              status: 'ended',
              actualEndDate: event.actualEndDate ? event.actualEndDate : actualEnd
            });
          })
        );
        console.log(`[Cron] Marked ${eventsToEnd.length} events as ended`);
      }

    } catch (error) {
      console.error('[Cron Error] Failed to update event statuses:', error);
    }
  });

  console.log('[Cron] Event status cron jobs initialized');
};

// Import helper for sequelize functions
import sequelize from '../config/database';
export default initCronJobs;
