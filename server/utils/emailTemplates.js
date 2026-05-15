// ── Helper: format date nicely ──────────────────────────
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

// ── Base layout wrapper ─────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>StayFinder</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:#111111;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">
                🏠 StayFinder
              </h1>
              <p style="margin:6px 0 0;color:#aaaaaa;font-size:13px;">
                Your trusted property rental platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:20px 32px;text-align:center;
                        border-top:1px solid #eeeeee;">
              <p style="margin:0;color:#999999;font-size:12px;">
                © 2025 StayFinder · All rights reserved<br/>
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ── Reusable info row ───────────────────────────────────
const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;color:#666666;font-size:14px;width:140px;
               vertical-align:top;border-bottom:1px solid #f0f0f0;">
      <strong>${label}</strong>
    </td>
    <td style="padding:8px 0;color:#111111;font-size:14px;
               border-bottom:1px solid #f0f0f0;">
      ${value}
    </td>
  </tr>`;

// ── Status badge ────────────────────────────────────────
const badge = (text, color) => `
  <span style="display:inline-block;background:${color};color:#ffffff;
    font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;
    letter-spacing:0.5px;">
    ${text}
  </span>`;

// ══════════════════════════════════════════════════════════
//  TEMPLATE 1: Booking Created (to Guest)
// ══════════════════════════════════════════════════════════
export const bookingCreatedGuestTemplate = ({ booking, guest, property }) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111111;font-size:20px;">
      Booking Request Sent! ✈️
    </h2>
    <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.6;">
      Hi <strong>${guest.name}</strong>, your booking request has been sent to the host.
      You will receive a confirmation email once the host approves it.
    </p>

    ${badge('PENDING CONFIRMATION', '#f59e0b')}

    <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 16px;color:#111111;font-size:15px;">
        📋 Booking Details
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Property', `<strong>${property.title}</strong>`)}
        ${infoRow('Location', `${property.location?.city}, ${property.location?.state}`)}
        ${infoRow('Check-In', formatDate(booking.checkIn))}
        ${infoRow('Check-Out', formatDate(booking.checkOut))}
        ${infoRow('Duration', `${booking.numNights} night${booking.numNights > 1 ? 's' : ''}`)}
        ${infoRow('Guests', `${booking.numGuests}`)}
        ${infoRow('Total Amount', `<strong style="color:#111111;font-size:16px;">₹${booking.totalPrice?.toLocaleString('en-IN')}</strong>`)}
        ${booking.specialRequests ? infoRow('Special Requests', booking.specialRequests) : ''}
      </table>
    </div>

    <p style="margin:0;color:#888888;font-size:13px;line-height:1.6;">
      You can view and manage your booking anytime from
      <strong>My Bookings</strong> section on StayFinder.
    </p>`;
  return baseTemplate(content);
};

// ══════════════════════════════════════════════════════════
//  TEMPLATE 2: New Booking Alert (to Host)
// ══════════════════════════════════════════════════════════
export const bookingCreatedHostTemplate = ({ booking, guest, property }) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111111;font-size:20px;">
      New Booking Request! 🔔
    </h2>
    <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.6;">
      Hi <strong>${property.host?.name || 'Host'}</strong>, you have received a new
      booking request for <strong>${property.title}</strong>.
      Please log in to confirm or decline.
    </p>

    ${badge('ACTION REQUIRED', '#ef4444')}

    <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 16px;color:#111111;font-size:15px;">
        👤 Guest Information
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Guest Name', `<strong>${guest.name}</strong>`)}
        ${infoRow('Email', guest.email)}
        ${infoRow('Phone', guest.phone || 'Not provided')}
      </table>
    </div>

    <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 16px;color:#111111;font-size:15px;">
        📋 Booking Details
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Check-In', formatDate(booking.checkIn))}
        ${infoRow('Check-Out', formatDate(booking.checkOut))}
        ${infoRow('Duration', `${booking.numNights} night${booking.numNights > 1 ? 's' : ''}`)}
        ${infoRow('Guests', `${booking.numGuests}`)}
        ${infoRow('Earnings', `<strong style="color:#16a34a;font-size:16px;">₹${booking.totalPrice?.toLocaleString('en-IN')}</strong>`)}
        ${booking.specialRequests ? infoRow('Special Requests', `<em>${booking.specialRequests}</em>`) : ''}
      </table>
    </div>

    <p style="margin:0;color:#888888;font-size:13px;">
      Log in to <strong>Guest Bookings</strong> on StayFinder to confirm or decline this request.
    </p>`;
  return baseTemplate(content);
};

// ══════════════════════════════════════════════════════════
//  TEMPLATE 3: Booking Confirmed (to Guest)
// ══════════════════════════════════════════════════════════
export const bookingConfirmedGuestTemplate = ({ booking, guest, property }) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111111;font-size:20px;">
      Booking Confirmed! 🎉
    </h2>
    <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.6;">
      Great news, <strong>${guest.name}</strong>! Your booking has been confirmed
      by the host. Get ready for your stay!
    </p>

    ${badge('CONFIRMED', '#16a34a')}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;
                padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 16px;color:#111111;font-size:15px;">
        🏠 Your Stay Details
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Property', `<strong>${property.title}</strong>`)}
        ${infoRow('Location', `${property.location?.city}, ${property.location?.state}, ${property.location?.country}`)}
        ${infoRow('Check-In', `<strong>${formatDate(booking.checkIn)}</strong>`)}
        ${infoRow('Check-Out', `<strong>${formatDate(booking.checkOut)}</strong>`)}
        ${infoRow('Duration', `${booking.numNights} night${booking.numNights > 1 ? 's' : ''}`)}
        ${infoRow('Guests', `${booking.numGuests}`)}
        ${infoRow('Total Paid', `<strong style="color:#16a34a;font-size:16px;">₹${booking.totalPrice?.toLocaleString('en-IN')}</strong>`)}
      </table>
    </div>

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;
                padding:16px;margin:20px 0;">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
        💡 <strong>Reminder:</strong> After your stay, you can share your experience
        by leaving a review on StayFinder. Your feedback helps the community!
      </p>
    </div>`;
  return baseTemplate(content);
};

// ══════════════════════════════════════════════════════════
//  TEMPLATE 4: Booking Cancelled (to Guest)
// ══════════════════════════════════════════════════════════
export const bookingCancelledGuestTemplate = ({ booking, guest, property, reason }) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111111;font-size:20px;">
      Booking Cancelled 😔
    </h2>
    <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.6;">
      Hi <strong>${guest.name}</strong>, your booking for
      <strong>${property.title}</strong> has been cancelled.
    </p>

    ${badge('CANCELLED', '#ef4444')}

    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:8px;
                padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Property', property.title)}
        ${infoRow('Check-In', formatDate(booking.checkIn))}
        ${infoRow('Check-Out', formatDate(booking.checkOut))}
        ${reason ? infoRow('Reason', `<em>${reason}</em>`) : ''}
      </table>
    </div>

    <p style="margin:0 0 16px;color:#555555;font-size:14px;line-height:1.6;">
      We are sorry for the inconvenience. You can search for other available
      properties on StayFinder and find a great alternative for your stay.
    </p>`;
  return baseTemplate(content);
};

// ══════════════════════════════════════════════════════════
//  TEMPLATE 5: Booking Cancelled (to Host)
// ══════════════════════════════════════════════════════════
export const bookingCancelledHostTemplate = ({ booking, guest, property, reason }) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111111;font-size:20px;">
      Booking Cancelled
    </h2>
    <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.6;">
      Hi <strong>${property.host?.name || 'Host'}</strong>, a booking for
      <strong>${property.title}</strong> has been cancelled.
    </p>

    ${badge('CANCELLED', '#ef4444')}

    <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Guest', guest.name)}
        ${infoRow('Check-In', formatDate(booking.checkIn))}
        ${infoRow('Check-Out', formatDate(booking.checkOut))}
        ${infoRow('Nights', `${booking.numNights}`)}
        ${reason ? infoRow('Reason', `<em>${reason}</em>`) : ''}
      </table>
    </div>

    <p style="margin:0;color:#555555;font-size:14px;line-height:1.6;">
      Those dates are now free again on your calendar. You may receive
      new booking requests for the same period.
    </p>`;
  return baseTemplate(content);
};

// ══════════════════════════════════════════════════════════
//  TEMPLATE 6: Upcoming Stay Reminder (to Guest) — 1 day before
// ══════════════════════════════════════════════════════════
export const upcomingStayReminderTemplate = ({ booking, guest, property }) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111111;font-size:20px;">
      Your Stay is Tomorrow! 🌟
    </h2>
    <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.6;">
      Hi <strong>${guest.name}</strong>, just a friendly reminder that
      your stay at <strong>${property.title}</strong> begins tomorrow!
    </p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;
                padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 16px;color:#111111;font-size:15px;">
        📅 Quick Summary
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Property', `<strong>${property.title}</strong>`)}
        ${infoRow('Location', `${property.location?.city}, ${property.location?.state}`)}
        ${infoRow('Check-In', `<strong>${formatDate(booking.checkIn)}</strong>`)}
        ${infoRow('Check-Out', formatDate(booking.checkOut))}
        ${infoRow('Guests', `${booking.numGuests}`)}
      </table>
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;
                padding:16px;margin:20px 0;">
      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;">
        ✅ <strong>All set!</strong> Your booking is confirmed. Have a wonderful stay and
        don't forget to leave a review afterwards!
      </p>
    </div>`;
  return baseTemplate(content);
};