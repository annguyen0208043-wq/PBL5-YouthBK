import Event from '../models/Event';
import EventRegistration from '../models/EventRegistration';
import User from '../models/User';
import CommunityPointHistory from '../models/CommunityPointHistory';

/**
 * Automatically credits community points to all students who checked in (attended or confirmed)
 * for the given event when the event ends.
 */
export const addCommunityPointsForEvent = async (eventId: number): Promise<void> => {
  try {
    const event = await Event.findByPk(eventId);
    if (!event) {
      console.log(`[PointHelper] Event with ID ${eventId} not found`);
      return;
    }

    const pointsToCredit = event.communityPoints || 0;
    if (pointsToCredit <= 0) {
      console.log(`[PointHelper] Event "${event.title}" has 0 community points. No points credited.`);
      return;
    }

    // Find all checked-in registrations
    const registrations = await EventRegistration.findAll({
      where: {
        eventId,
        status: ['attended', 'confirmed']
      }
    });

    console.log(`[PointHelper] Found ${registrations.length} checked-in students for event "${event.title}"`);

    for (const reg of registrations) {
      const studentId = reg.userId;

      // Avoid double crediting points for the same event
      const existingHistory = await CommunityPointHistory.findOne({
        where: {
          userId: studentId,
          eventId
        }
      });

      if (existingHistory) {
        console.log(`[PointHelper] Student ID ${studentId} already received points for event ID ${eventId}`);
        continue;
      }

      // Add points to User
      const student = await User.findByPk(studentId);
      if (student) {
        const previousPoints = student.communityPoints || 0;
        await student.update({
          communityPoints: previousPoints + pointsToCredit
        });

        // Save history entry
        await CommunityPointHistory.create({
          userId: studentId,
          eventId,
          points: pointsToCredit,
          reason: `Tham gia sự kiện: ${event.title}`
        });

        console.log(`[PointHelper] Credited ${pointsToCredit} points to Student "${student.name}" (ID ${studentId})`);
      }
    }
  } catch (error) {
    console.error(`[PointHelper Error] Failed to add community points for event ID ${eventId}:`, error);
  }
};
