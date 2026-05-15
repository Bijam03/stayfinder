import cron from 'node-cron';
import Booking from '../models/Booking.js';
import sendEmail from '../utils/sendEmail.js';
import { upcomingStayReminderTemplate } from '../utils/emailTemplates.js';

// Runs every day at 9:00 AM
const startReminderJob = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running upcoming stay reminder job...');
    try {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);

      // Find all confirmed bookings checking in tomorrow
      const bookings = await Booking.find({
        status: 'confirmed',
        checkIn: { $gte: tomorrow, $lt: dayAfter },
      })
        .populate('guest', 'name email')
        .populate('property', 'title location');

      console.log(`📧 Sending ${bookings.length} reminder email(s)...`);

      for (const booking of bookings) {
        await sendEmail({
          to: booking.guest.email,
          subject: `Reminder: Your stay at ${booking.property.title} is tomorrow!`,
          html: upcomingStayReminderTemplate({
            booking,
            guest: booking.guest,
            property: booking.property,
          }),
        });
      }
    } catch (error) {
      console.error('❌ Reminder job error:', error.message);
    }
  });
  console.log('✅ Reminder cron job started (runs daily at 9:00 AM)');
};

export default startReminderJob;