import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * In-memory idempotency cache to prevent duplicate email dispatches
 * for the same booking reference or ID within a 10-minute window.
 */
const sentEmailsCache = new Map();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

function cleanExpiredIdempotencyEntries() {
  const now = Date.now();
  for (const [key, timestamp] of sentEmailsCache.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL_MS) {
      sentEmailsCache.delete(key);
    }
  }
}

/**
 * Escapes HTML characters to prevent XSS / HTML injection in email clients
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes header strings to prevent email header injection (CRLF)
 */
export function sanitizeHeader(str) {
  if (!str) return '';
  return String(str).replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Formats appointment date and time nicely using target timezone
 */
export function formatAppointmentDateTime(startTime, endTime, timezone = 'Asia/Kolkata') {
  try {
    const tz = timezone || 'Asia/Kolkata';
    const zonedStart = toZonedTime(new Date(startTime), tz);
    const zonedEnd = toZonedTime(new Date(endTime), tz);

    const formattedDate = format(zonedStart, 'EEEE, MMMM d, yyyy');
    const formattedStartTime = format(zonedStart, 'hh:mm a');
    const formattedEndTime = format(zonedEnd, 'hh:mm a');
    const formattedTime = `${formattedStartTime} – ${formattedEndTime} (${tz})`;

    return { formattedDate, formattedStartTime, formattedEndTime, formattedTime };
  } catch (err) {
    return {
      formattedDate: new Date(startTime).toDateString(),
      formattedStartTime: new Date(startTime).toLocaleTimeString(),
      formattedEndTime: new Date(endTime).toLocaleTimeString(),
      formattedTime: `${new Date(startTime).toLocaleTimeString()} – ${new Date(endTime).toLocaleTimeString()}`
    };
  }
}

/**
 * Active nodemailer transporter instance (or mock for testing)
 */
let customTransporter = null;

export function setCustomTransporter(transporter) {
  customTransporter = transporter;
}

export function resetCustomTransporter() {
  customTransporter = null;
}

/**
 * Creates and returns the Gmail SMTP transporter
 */
export function getTransporter() {
  if (customTransporter) {
    return customTransporter;
  }

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
}

/**
 * Checks if Gmail credentials are provided and not placeholders
 */
export function isEmailConfigured() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!user || !pass) return false;
  if (user === 'yourbusiness@gmail.com' || pass === 'your_16_character_app_password') {
    return false;
  }
  return true;
}

/**
 * Generates responsive, barber-shop branded HTML email template
 */
export function generateBookingEmailHtml(booking, options = {}) {
  const {
    businessName = 'Santosh Hair Art',
    barberName = 'Santosh Hair Art (Studio Barber)',
    timezone = 'Asia/Kolkata'
  } = options;

  const { formattedDate, formattedTime } = formatAppointmentDateTime(
    booking.startTime,
    booking.endTime,
    timezone
  );

  const customerName = escapeHtml(booking.customerName || 'Valued Customer');
  const customerPhone = escapeHtml(booking.customerPhone || 'Not provided');
  const customerEmail = booking.customerEmail ? escapeHtml(booking.customerEmail) : null;
  const bookingRef = escapeHtml(booking.bookingReference || booking.id || 'N/A');
  const bookingId = escapeHtml(booking.id || 'N/A');
  const notes = booking.notes ? escapeHtml(booking.notes) : null;
  const status = escapeHtml(booking.status || 'CONFIRMED');
  const totalDuration = Number(booking.totalDurationMinutes) || 0;
  const totalPriceFormatted = booking.totalPricePaise != null
    ? `₹${(booking.totalPricePaise / 100).toFixed(2)}`
    : 'Free';

  const services = Array.isArray(booking.bookingServices) && booking.bookingServices.length > 0
    ? booking.bookingServices
    : [{ serviceName: 'Barbershop Appointment', durationMinutes: totalDuration, pricePaise: booking.totalPricePaise || 0 }];

  const serviceRowsHtml = services.map(s => {
    const sName = escapeHtml(s.serviceName || 'Service');
    const sDur = Number(s.durationMinutes) || 0;
    const sPrice = s.pricePaise != null ? `₹${(s.pricePaise / 100).toFixed(2)}` : '—';
    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px;">
          ${sName}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: center;">
          ${sDur} min
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">
          ${sPrice}
        </td>
      </tr>
    `;
  }).join('');

  const statusBg = status === 'CONFIRMED' ? '#dcfce7' : status === 'PENDING' ? '#fef3c7' : '#f3f4f6';
  const statusColor = status === 'CONFIRMED' ? '#166534' : status === 'PENDING' ? '#92400e' : '#374151';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Barber Appointment – ${customerName}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 20px 16px !important; }
      .two-col { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f3f4f6;">
  <center>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" class="container">
      
      <!-- Brand Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 28px 24px; text-align: center; border-bottom: 3px solid #d4af37;">
          <div style="font-size: 24px; margin-bottom: 6px;">✂️💈✂️</div>
          <h1 style="margin: 0; color: #f4f4f5; font-size: 22px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            ${escapeHtml(businessName)}
          </h1>
          <p style="margin: 6px 0 0; color: #d4af37; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
            NEW APPOINTMENT NOTIFICATION
          </p>
        </td>
      </tr>

      <!-- Notification Banner -->
      <tr>
        <td style="padding: 24px 28px 12px 28px;" class="content-padding">
          <table role="presentation" width="100%">
            <tr>
              <td>
                <span style="display: inline-block; background-color: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Status: ${status}
                </span>
                <span style="display: inline-block; margin-left: 8px; color: #6b7280; font-size: 13px;">
                  Ref: <strong style="color: #111827;">${bookingRef}</strong>
                </span>
              </td>
            </tr>
          </table>
          <h2 style="margin: 16px 0 4px; font-size: 18px; color: #111827; font-weight: 700;">
            A new booking was scheduled
          </h2>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
            Here are the full appointment details for the barber schedule:
          </p>
        </td>
      </tr>

      <!-- Appointment Date & Time Highlight -->
      <tr>
        <td style="padding: 0 28px;" class="content-padding">
          <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-left: 4px solid #d4af37; border-radius: 6px; padding: 14px 18px; margin: 12px 0 20px;">
            <table role="presentation" width="100%">
              <tr>
                <td style="vertical-align: middle;">
                  <div style="font-size: 12px; text-transform: uppercase; color: #78716c; font-weight: 700; letter-spacing: 0.5px;">
                    Date & Time
                  </div>
                  <div style="font-size: 16px; font-weight: 700; color: #1c1917; margin-top: 4px;">
                    📅 ${escapeHtml(formattedDate)}
                  </div>
                  <div style="font-size: 14px; font-weight: 600; color: #b45309; margin-top: 2px;">
                    ⏰ ${escapeHtml(formattedTime)}
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>

      <!-- Customer & Barber Summary Grid -->
      <tr>
        <td style="padding: 0 28px;" class="content-padding">
          <table role="presentation" width="100%" style="margin-bottom: 20px;">
            <tr>
              <td width="50%" style="vertical-align: top; padding-right: 12px;" class="two-col">
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
                  <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-bottom: 6px;">
                    Customer Details
                  </div>
                  <div style="font-size: 15px; font-weight: 700; color: #111827;">
                    ${customerName}
                  </div>
                  <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">
                    📞 <a href="tel:${customerPhone}" style="color: #2563eb; text-decoration: none;">${customerPhone}</a>
                  </div>
                  ${customerEmail ? `
                  <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">
                    ✉️ <a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a>
                  </div>
                  ` : `
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 4px; font-style: italic;">
                    No email provided
                  </div>
                  `}
                </div>
              </td>
              <td width="50%" style="vertical-align: top; padding-left: 12px;" class="two-col">
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
                  <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-bottom: 6px;">
                    Barber / Stylist
                  </div>
                  <div style="font-size: 15px; font-weight: 700; color: #111827;">
                    ${escapeHtml(barberName)}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                    Booking ID: <code style="font-size: 11px; background: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${bookingId.slice(0, 13)}...</code>
                  </div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                    Duration: <strong>${totalDuration} minutes</strong>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Services Table -->
      <tr>
        <td style="padding: 0 28px;" class="content-padding">
          <div style="font-size: 13px; text-transform: uppercase; color: #374151; font-weight: 700; margin-bottom: 8px;">
            Booked Services
          </div>
          <table role="presentation" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Service</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Duration</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${serviceRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #fdfaf6;">
                <td colspan="2" style="padding: 12px; font-size: 14px; font-weight: 700; color: #111827; text-align: right;">
                  Total Amount (${totalDuration} min):
                </td>
                <td style="padding: 12px; font-size: 16px; font-weight: 800; color: #b45309; text-align: right;">
                  ${totalPriceFormatted}
                </td>
              </tr>
            </tfoot>
          </table>
        </td>
      </tr>

      <!-- Customer Notes (if provided) -->
      ${notes ? `
      <tr>
        <td style="padding: 0 28px;" class="content-padding">
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
            <div style="font-size: 12px; text-transform: uppercase; color: #1e40af; font-weight: 700; margin-bottom: 4px;">
              📝 Customer Notes
            </div>
            <div style="font-size: 14px; color: #1e3a8a; line-height: 1.5; white-space: pre-wrap;">
              ${notes}
            </div>
          </div>
        </td>
      </tr>
      ` : ''}

      <!-- Footer -->
      <tr>
        <td style="background-color: #18181b; padding: 24px 28px; text-align: center; border-top: 1px solid #27272a;">
          <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.5;">
            This is an automated notification from the <strong>${escapeHtml(businessName)}</strong> online booking engine.
          </p>
          <p style="margin: 8px 0 0; color: #71717a; font-size: 11px;">
            Booking Reference: ${bookingRef} • Internal ID: ${bookingId}
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;
}

/**
 * Generates clean plain-text fallback representation
 */
export function generateBookingEmailText(booking, options = {}) {
  const {
    businessName = 'Santosh Hair Art',
    barberName = 'Santosh Hair Art (Studio Barber)',
    timezone = 'Asia/Kolkata'
  } = options;

  const { formattedDate, formattedTime } = formatAppointmentDateTime(
    booking.startTime,
    booking.endTime,
    timezone
  );

  const customerName = booking.customerName || 'Valued Customer';
  const customerPhone = booking.customerPhone || 'Not provided';
  const customerEmail = booking.customerEmail || 'Not provided';
  const bookingRef = booking.bookingReference || booking.id || 'N/A';
  const bookingId = booking.id || 'N/A';
  const notes = booking.notes || 'None';
  const status = booking.status || 'CONFIRMED';
  const totalDuration = Number(booking.totalDurationMinutes) || 0;
  const totalPrice = booking.totalPricePaise != null
    ? `₹${(booking.totalPricePaise / 100).toFixed(2)}`
    : 'Free';

  const services = Array.isArray(booking.bookingServices) && booking.bookingServices.length > 0
    ? booking.bookingServices
    : [{ serviceName: 'Barbershop Appointment', durationMinutes: totalDuration, pricePaise: booking.totalPricePaise || 0 }];

  const serviceLines = services
    .map(s => `- ${s.serviceName}: ${s.durationMinutes} min (${s.pricePaise != null ? `₹${(s.pricePaise / 100).toFixed(2)}` : '—'})`)
    .join('\n');

  return `=======================================================
${businessName.toUpperCase()} — NEW APPOINTMENT NOTIFICATION
=======================================================

A new barber appointment has been scheduled.

APPOINTMENT SUMMARY:
-------------------------------------------------------
Booking Reference: ${bookingRef}
Internal Booking ID: ${bookingId}
Status:            ${status}
Date:              ${formattedDate}
Time:              ${formattedTime}
Selected Barber:   ${barberName}

CUSTOMER DETAILS:
-------------------------------------------------------
Name:              ${customerName}
Phone:             ${customerPhone}
Email:             ${customerEmail}

BOOKED SERVICES:
-------------------------------------------------------
${serviceLines}

Total Duration:    ${totalDuration} minutes
Total Price:       ${totalPrice}

CUSTOMER NOTES:
-------------------------------------------------------
${notes}

=======================================================
This is an automated notification from ${businessName}.
`;
}

/**
 * Sends a booking notification email to the barber owner.
 * Safe against double sends, invalid SMTP settings, and network drops.
 *
 * @param {Object} booking - Booking database record with bookingServices
 * @param {Object} [options] - Optional overrides (businessName, barberName, timezone)
 * @returns {Promise<{ success: boolean, messageId?: string, skipped?: boolean, duplicate?: boolean, error?: string }>}
 */
export async function sendBookingNotification(booking, options = {}) {
  if (!booking) {
    return { success: false, error: 'No booking data provided for email notification' };
  }

  // Idempotency check: don't send duplicate emails for the same booking within TTL
  cleanExpiredIdempotencyEntries();
  const cacheKey = booking.bookingReference || booking.id;
  if (cacheKey && sentEmailsCache.has(cacheKey)) {
    console.info(`[EmailService] Skipping duplicate email notification for booking: ${cacheKey}`);
    return { success: true, duplicate: true };
  }

  // Check SMTP configuration
  if (!isEmailConfigured() && !customTransporter) {
    console.warn(
      '[EmailService] Gmail SMTP not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing/default). Skipping email dispatch.'
    );
    return { success: false, skipped: true, reason: 'SMTP not configured' };
  }

  const recipient = (
    process.env.BARBER_OWNER_EMAIL ||
    process.env.GMAIL_USER
  )?.trim();

  if (!recipient) {
    console.warn('[EmailService] Neither BARBER_OWNER_EMAIL nor GMAIL_USER is set.');
    return { success: false, skipped: true, reason: 'No recipient email configured' };
  }

  const customerName = sanitizeHeader(booking.customerName || 'Customer');
  const subject = `New Barber Appointment – ${customerName}`;

  try {
    const transporter = getTransporter();

    const htmlContent = generateBookingEmailHtml(booking, options);
    const textContent = generateBookingEmailText(booking, options);

    const senderEmail = process.env.GMAIL_USER || 'no-reply@santoshhairart.in';
    const businessName = sanitizeHeader(options.businessName || 'Santosh Hair Art');

    const mailOptions = {
      from: `"${businessName}" <${senderEmail}>`,
      to: recipient,
      subject,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    if (cacheKey) {
      sentEmailsCache.set(cacheKey, Date.now());
    }

    console.info(`[EmailService] Booking notification successfully sent to ${recipient} (Message ID: ${info.messageId || 'sent'})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Safe error logging: log only safe diagnostic info, NEVER secrets or app passwords
    console.error(`[EmailService] Failed to send booking notification for ${cacheKey || 'unknown'}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Verifies Gmail SMTP connectivity without sending an email.
 *
 * @returns {Promise<{ success: boolean, message?: string, error?: string }>}
 */
export async function verifySmtpConnection() {
  if (!isEmailConfigured() && !customTransporter) {
    return {
      success: false,
      error: 'Gmail credentials not configured in environment variables (GMAIL_USER or GMAIL_APP_PASSWORD).'
    };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully.' };
  } catch (err) {
    console.error(`[EmailService] SMTP verification failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a test email to explicitly verify end-to-end delivery without creating an appointment.
 *
 * @param {string} [targetEmail] - Destination email address (defaults to BARBER_OWNER_EMAIL)
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendTestEmail(targetEmail) {
  const recipient = (targetEmail || process.env.BARBER_OWNER_EMAIL || process.env.GMAIL_USER)?.trim();

  if (!recipient) {
    return { success: false, error: 'No recipient email specified for test message.' };
  }

  const dummyBooking = {
    id: 'test-preview-' + Date.now(),
    bookingReference: 'SHA-TEST-' + Math.floor(1000 + Math.random() * 9000),
    customerName: 'Test Booking Client',
    customerPhone: '+91 95378 51649',
    customerEmail: recipient,
    notes: 'This is a test notification verifying Gmail SMTP integration.',
    totalPricePaise: 25000,
    totalDurationMinutes: 45,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    status: 'CONFIRMED',
    bookingServices: [
      { serviceName: 'Classic Haircut & Styling', durationMinutes: 30, pricePaise: 15000 },
      { serviceName: 'Beard Trim & Shape', durationMinutes: 15, pricePaise: 10000 }
    ]
  };

  try {
    const transporter = getTransporter();
    const senderEmail = process.env.GMAIL_USER || 'no-reply@santoshhairart.in';

    const mailOptions = {
      from: `"Santosh Hair Art (Test)" <${senderEmail}>`,
      to: recipient,
      subject: `[Test] New Barber Appointment – ${dummyBooking.customerName}`,
      text: generateBookingEmailText(dummyBooking),
      html: generateBookingEmailHtml(dummyBooking)
    };

    const info = await transporter.sendMail(mailOptions);
    console.info(`[EmailService] Test email delivered to ${recipient} (Message ID: ${info.messageId || 'sent'})`);
    return { success: true, messageId: info.messageId, recipient };
  } catch (err) {
    console.error(`[EmailService] Failed to send test email: ${err.message}`);
    return { success: false, error: err.message };
  }
}


/**
 * Generates customer email HTML for CANCELLED or COMPLETED appointment status
 */
export function generateCustomerStatusEmailHtml(booking, status, options = {}) {
  const {
    businessName = 'Santosh Hair Art',
    phoneNumber = '+91 95378 51649',
    timezone = 'Asia/Kolkata'
  } = options;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { formattedDate, formattedTime } = formatAppointmentDateTime(
    booking.startTime,
    booking.endTime,
    timezone
  );

  const customerName = escapeHtml(booking.customerName || 'Valued Customer');
  const bookingRef = escapeHtml(booking.bookingReference || booking.id || 'N/A');
  const totalDuration = Number(booking.totalDurationMinutes) || 0;
  const totalPriceFormatted = booking.totalPricePaise != null
    ? `₹${(booking.totalPricePaise / 100).toFixed(2)}`
    : 'Free';

  const services = Array.isArray(booking.bookingServices) && booking.bookingServices.length > 0
    ? booking.bookingServices
    : [{ serviceName: 'Barbershop Appointment', durationMinutes: totalDuration, pricePaise: booking.totalPricePaise || 0 }];

  const serviceRowsHtml = services.map(s => {
    const sName = escapeHtml(s.serviceName || 'Service');
    const sDur = Number(s.durationMinutes) || 0;
    const sPrice = s.pricePaise != null ? `₹${(s.pricePaise / 100).toFixed(2)}` : '—';
    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px;">
          ${sName}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: center;">
          ${sDur} min
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">
          ${sPrice}
        </td>
      </tr>
    `;
  }).join('');

  const isCancelled = status === 'CANCELLED';
  const statusBadgeBg = isCancelled ? '#fee2e2' : '#dcfce7';
  const statusBadgeColor = isCancelled ? '#991b1b' : '#166534';
  const headline = isCancelled
    ? 'Your Appointment Has Been Cancelled'
    : 'Thank You for Visiting Santosh Hair Art!';
  const messageBody = isCancelled
    ? `Hello <strong>${customerName}</strong>, your appointment scheduled at <strong>${escapeHtml(businessName)}</strong> has been cancelled.`
    : `Hello <strong>${customerName}</strong>, thank you for choosing <strong>${escapeHtml(businessName)}</strong> today! We hope you loved your fresh cut and grooming experience.`;

  const reasonHtml = isCancelled && booking.cancellationReason ? `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
      <div style="font-size: 11px; text-transform: uppercase; color: #991b1b; font-weight: 700; letter-spacing: 0.5px;">
        Cancellation Reason
      </div>
      <div style="font-size: 14px; color: #7f1d1d; margin-top: 4px;">
        ${escapeHtml(booking.cancellationReason)}
      </div>
    </div>
  ` : '';

  const buttonText = isCancelled ? 'Book a New Appointment' : 'Book Your Next Appointment';
  const buttonUrl = `${frontendUrl}/book`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; }
    table { border-collapse: collapse; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f3f4f6;">
  <center>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" class="container">
      
      <!-- Brand Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 28px 24px; text-align: center; border-bottom: 3px solid #d4af37;">
          <div style="font-size: 24px; margin-bottom: 6px;">✂️💈✂️</div>
          <h1 style="margin: 0; color: #f4f4f5; font-size: 22px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            ${escapeHtml(businessName)}
          </h1>
          <p style="margin: 6px 0 0; color: #d4af37; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
            ${isCancelled ? 'APPOINTMENT UPDATE' : 'THANK YOU FOR YOUR VISIT'}
          </p>
        </td>
      </tr>

      <!-- Headline & Status -->
      <tr>
        <td style="padding: 24px 28px 12px 28px;" class="content-padding">
          <span style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
            Status: ${status}
          </span>
          <span style="display: inline-block; margin-left: 8px; color: #6b7280; font-size: 13px;">
            Booking Ref: <strong style="color: #111827;">${bookingRef}</strong>
          </span>
          <h2 style="margin: 16px 0 6px; font-size: 20px; color: #111827; font-weight: 700;">
            ${headline}
          </h2>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
            ${messageBody}
          </p>
          ${reasonHtml}
        </td>
      </tr>

      <!-- Appointment Date & Time Highlight -->
      <tr>
        <td style="padding: 0 28px;" class="content-padding">
          <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-left: 4px solid ${isCancelled ? '#ef4444' : '#16a34a'}; border-radius: 6px; padding: 14px 18px; margin: 12px 0 20px;">
            <div style="font-size: 12px; text-transform: uppercase; color: #78716c; font-weight: 700; letter-spacing: 0.5px;">
              ${isCancelled ? 'Cancelled Date & Time' : 'Appointment Completed'}
            </div>
            <div style="font-size: 16px; font-weight: 700; color: #1c1917; margin-top: 4px;">
              📅 ${escapeHtml(formattedDate)}
            </div>
            <div style="font-size: 14px; font-weight: 600; color: #4b5563; margin-top: 2px;">
              ⏰ ${escapeHtml(formattedTime)}
            </div>
          </div>
        </td>
      </tr>

      <!-- Booked Services Table -->
      <tr>
        <td style="padding: 0 28px;" class="content-padding">
          <div style="font-size: 13px; text-transform: uppercase; color: #374151; font-weight: 700; margin-bottom: 8px;">
            Service Summary
          </div>
          <table role="presentation" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Service</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Duration</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${serviceRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #fdfaf6;">
                <td colspan="2" style="padding: 12px; font-size: 14px; font-weight: 700; color: #111827; text-align: right;">
                  Total (${totalDuration} min):
                </td>
                <td style="padding: 12px; font-size: 16px; font-weight: 800; color: #b45309; text-align: right;">
                  ${totalPriceFormatted}
                </td>
              </tr>
            </tfoot>
          </table>
        </td>
      </tr>

      <!-- Action Button CTA -->
      <tr>
        <td style="padding: 0 28px 24px 28px; text-align: center;" class="content-padding">
          <a href="${buttonUrl}" style="display: inline-block; background-color: #d4af37; color: #18181b; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.12);">
            ${buttonText}
          </a>
          <p style="margin: 14px 0 0; font-size: 12px; color: #6b7280;">
            Have questions? Call or WhatsApp us at <strong style="color: #111827;">${escapeHtml(phoneNumber)}</strong>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #18181b; padding: 24px 28px; text-align: center; border-top: 1px solid #27272a;">
          <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.5;">
            Thank you for being a valued guest of <strong>${escapeHtml(businessName)}</strong>.
          </p>
          <p style="margin: 8px 0 0; color: #71717a; font-size: 11px;">
            Booking Reference: ${bookingRef}
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;
}

/**
 * Generates customer plain-text email for status updates
 */
export function generateCustomerStatusEmailText(booking, status, options = {}) {
  const {
    businessName = 'Santosh Hair Art',
    phoneNumber = '+91 95378 51649',
    timezone = 'Asia/Kolkata'
  } = options;

  const { formattedDate, formattedTime } = formatAppointmentDateTime(
    booking.startTime,
    booking.endTime,
    timezone
  );

  const customerName = booking.customerName || 'Valued Customer';
  const bookingRef = booking.bookingReference || booking.id || 'N/A';
  const totalDuration = Number(booking.totalDurationMinutes) || 0;
  const totalPrice = booking.totalPricePaise != null
    ? `₹${(booking.totalPricePaise / 100).toFixed(2)}`
    : 'Free';

  const isCancelled = status === 'CANCELLED';
  const headline = isCancelled
    ? 'APPOINTMENT CANCELLED NOTIFICATION'
    : 'THANK YOU FOR VISITING SANTOSH HAIR ART';

  const reasonLine = isCancelled && booking.cancellationReason
    ? `\nCancellation Reason: ${booking.cancellationReason}\n`
    : '';

  const services = Array.isArray(booking.bookingServices) && booking.bookingServices.length > 0
    ? booking.bookingServices
    : [{ serviceName: 'Barbershop Appointment', durationMinutes: totalDuration, pricePaise: booking.totalPricePaise || 0 }];

  const serviceLines = services
    .map(s => `- ${s.serviceName}: ${s.durationMinutes} min (${s.pricePaise != null ? `₹${(s.pricePaise / 100).toFixed(2)}` : '—'})`)
    .join('\n');

  return `=======================================================
${businessName.toUpperCase()} — ${headline}
=======================================================

Hello ${customerName},

${isCancelled
  ? `Your appointment scheduled at ${businessName} has been cancelled.`
  : `Thank you for visiting ${businessName} today! We hope you loved your grooming service.`}
${reasonLine}
APPOINTMENT DETAILS:
-------------------------------------------------------
Booking Reference: ${bookingRef}
Status:            ${status}
Date:              ${formattedDate}
Time:              ${formattedTime}

SERVICES:
-------------------------------------------------------
${serviceLines}

Total Duration:    ${totalDuration} minutes
Total Amount:      ${totalPrice}

-------------------------------------------------------
Need to book or have questions?
Call or WhatsApp: ${phoneNumber}
Visit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/book

Thank you,
${businessName} Team
`;
}

/**
 * Sends an email notification to the customer when their booking is CANCELLED or COMPLETED
 */
export async function sendCustomerBookingStatusNotification(booking, status, options = {}) {
  if (!booking) {
    return { success: false, error: 'No booking data provided' };
  }

  const customerEmail = booking.customerEmail?.trim();
  if (!customerEmail) {
    console.info(`[EmailService] No customer email registered for booking ${booking.bookingReference || booking.id}. Skipping customer notification.`);
    return { success: false, skipped: true, reason: 'No customer email' };
  }

  if (status !== 'CANCELLED' && status !== 'COMPLETED') {
    return { success: false, skipped: true, reason: 'Status notification not required for status: ' + status };
  }

  if (!isEmailConfigured() && !customTransporter) {
    console.warn('[EmailService] Gmail SMTP not configured. Skipping customer status email.');
    return { success: false, skipped: true, reason: 'SMTP not configured' };
  }

  const businessName = sanitizeHeader(options.businessName || 'Santosh Hair Art');
  const bookingRef = sanitizeHeader(booking.bookingReference || booking.id || 'N/A');

  const subject = status === 'CANCELLED'
    ? `Appointment Cancelled – ${businessName} [${bookingRef}]`
    : `Thank You for Visiting ${businessName}! [${bookingRef}]`;

  try {
    const transporter = getTransporter();
    const htmlContent = generateCustomerStatusEmailHtml(booking, status, options);
    const textContent = generateCustomerStatusEmailText(booking, status, options);
    const senderEmail = process.env.GMAIL_USER || 'no-reply@santoshhairart.in';

    const mailOptions = {
      from: `"${businessName}" <${senderEmail}>`,
      to: customerEmail,
      subject,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.info(`[EmailService] Customer status email (${status}) successfully delivered to ${customerEmail} (Message ID: ${info.messageId || 'sent'})`);
    return { success: true, messageId: info.messageId, recipient: customerEmail };
  } catch (err) {
    console.error(`[EmailService] Failed to send customer status email (${status}) to ${customerEmail}: ${err.message}`);
    return { success: false, error: err.message };
  }
}


/**
 * Generates OTP email HTML
 */
export function generateOtpEmailHtml(otp, options = {}) {
  const {
    businessName = 'Santosh Hair Art'
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Verification Code</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <center>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <tr>
        <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 24px; text-align: center; border-bottom: 3px solid #d4af37;">
          <div style="font-size: 24px; margin-bottom: 4px;">✂️💈✂️</div>
          <h1 style="margin: 0; color: #f4f4f5; font-size: 20px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            ${escapeHtml(businessName)}
          </h1>
          <p style="margin: 4px 0 0; color: #d4af37; font-size: 12px; font-weight: 600;">
            ACCOUNT VERIFICATION
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px; text-align: center;">
          <h2 style="margin: 0 0 12px; font-size: 18px; color: #111827; font-weight: 700;">
            Verify Your Email Address
          </h2>
          <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px; line-height: 1.6;">
            Thank you for creating an account with ${escapeHtml(businessName)}. Please enter the following 6-digit verification code to complete your registration:
          </p>
          <div style="margin: 20px auto; display: inline-block; background-color: #fafaf9; border: 2px dashed #d4af37; padding: 14px 28px; border-radius: 8px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #18181b;">
              ${escapeHtml(otp)}
            </span>
          </div>
          <p style="margin: 24px 0 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
            ⏳ This code will expire in <strong>10 minutes</strong>. For your security, do not share this code with anyone.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #18181b; padding: 18px 24px; text-align: center; border-top: 1px solid #27272a;">
          <p style="margin: 0; color: #71717a; font-size: 11px;">
            If you did not request this verification, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

/**
 * Generates OTP email plain text
 */
export function generateOtpEmailText(otp, options = {}) {
  const {
    businessName = 'Santosh Hair Art'
  } = options;

  return `=======================================================
${businessName.toUpperCase()} — ACCOUNT VERIFICATION
=======================================================

Your 6-digit verification code is:

    ${otp}

This code expires in 10 minutes.

If you did not request this code, please ignore this email.

Thank you,
${businessName} Team
`;
}

/**
 * Sends OTP email to the user
 */
export async function sendOtpEmail(email, otp, options = {}) {
  if (!email || !otp) {
    return { success: false, error: 'Email and OTP are required' };
  }

  const businessName = sanitizeHeader(options.businessName || 'Santosh Hair Art');
  const subject = `${otp} is your ${businessName} verification code`;

  if (!isEmailConfigured() && !customTransporter) {
    console.warn(`[EmailService] Gmail SMTP not configured. OTP for ${email}: ${otp}`);
    return { success: true, devMode: true, otp };
  }

  try {
    const transporter = getTransporter();
    const htmlContent = generateOtpEmailHtml(otp, options);
    const textContent = generateOtpEmailText(otp, options);
    const senderEmail = process.env.GMAIL_USER || 'no-reply@santoshhairart.in';

    const mailOptions = {
      from: `"${businessName}" <${senderEmail}>`,
      to: email.trim().toLowerCase(),
      subject,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.info(`[EmailService] Registration OTP successfully sent to ${email} (Message ID: ${info.messageId || 'sent'})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send OTP to ${email}: ${err.message}`);
    return { success: false, error: err.message };
  }
}


/**
 * Sends a booking phone verification code to customer email (if provided)
 */
export async function sendBookingPhoneOtpEmail(email, phone, otp, options = {}) {
  if (!email || !otp) return { success: false, skipped: true };

  const businessName = sanitizeHeader(options.businessName || 'Santosh Hair Art');
  const subject = `${otp} is your ${businessName} appointment verification code`;

  if (!isEmailConfigured() && !customTransporter) {
    console.warn(`[EmailService] SMTP not configured. Booking OTP for ${phone}: ${otp}`);
    return { success: true, devMode: true, otp };
  }

  try {
    const transporter = getTransporter();
    const senderEmail = process.env.GMAIL_USER || 'no-reply@santoshhairart.in';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Appointment Verification</title></head>
<body style="margin: 0; padding: 24px 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <center>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <tr>
        <td style="background: #18181b; padding: 22px; text-align: center; border-bottom: 3px solid #d4af37;">
          <h1 style="margin: 0; color: #f4f4f5; font-size: 18px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
            ${escapeHtml(businessName)}
          </h1>
          <p style="margin: 4px 0 0; color: #d4af37; font-size: 11px; font-weight: 600;">
            MOBILE NUMBER VERIFICATION
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 26px 20px; text-align: center;">
          <h2 style="margin: 0 0 10px; font-size: 17px; color: #111827;">Appointment Slot Verification</h2>
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 13px; line-height: 1.5;">
            To verify your mobile number (<strong>${escapeHtml(phone)}</strong>) and confirm your appointment, please enter this code:
          </p>
          <div style="display: inline-block; background-color: #fafaf9; border: 2px dashed #d4af37; padding: 12px 26px; border-radius: 8px;">
            <span style="font-family: monospace; font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #18181b;">
              ${escapeHtml(otp)}
            </span>
          </div>
          <p style="margin: 20px 0 0; color: #71717a; font-size: 11px;">
            Valid for 10 minutes. Do not share this code with anyone.
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;

    const textContent = `${businessName} Appointment Verification Code: ${otp}\n\nPlease enter this code to verify your mobile number (${phone}) and confirm your appointment.\n\nExpires in 10 minutes.`;

    const mailOptions = {
      from: `"${businessName}" <${senderEmail}>`,
      to: email.trim().toLowerCase(),
      subject,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.info(`[EmailService] Booking phone verification OTP sent to ${email} (Message ID: ${info.messageId || 'sent'})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send booking OTP to ${email}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export default {
  sendBookingNotification,
  verifySmtpConnection,
  sendTestEmail,
  isEmailConfigured,
  getTransporter,
  setCustomTransporter,
  resetCustomTransporter,
  generateBookingEmailHtml,
  generateBookingEmailText,
  escapeHtml,
  sanitizeHeader,
  formatAppointmentDateTime,
  sendCustomerBookingStatusNotification,
  generateCustomerStatusEmailHtml,
  generateCustomerStatusEmailText,
  sendOtpEmail,
  generateOtpEmailHtml,
  generateOtpEmailText,
  sendBookingPhoneOtpEmail
};
