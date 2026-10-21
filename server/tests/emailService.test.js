import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import {
  sendBookingNotification,
  verifySmtpConnection,
  sendTestEmail,
  escapeHtml,
  sanitizeHeader,
  generateBookingEmailHtml,
  generateBookingEmailText,
  setCustomTransporter,
  resetCustomTransporter
} from '../src/services/emailService.js';

const TEST_CUSTOMER_NAMES = ['Amit Trivedi', 'Slot Owner', 'Intruder Booking', 'Resilient Customer', 'Cancel Test Client', 'Complete Test Client', 'No Email Client'];

describe('Email Service & Booking Notification Integration Tests', () => {
  let sampleService;
  let mockTransporter;
  let sentMails = [];

  beforeEach(async () => {
    sentMails = [];
    mockTransporter = {
      sendMail: vi.fn().mockImplementation((mailOptions) => {
        sentMails.push(mailOptions);
        return Promise.resolve({ messageId: 'mock-msg-' + Date.now() });
      }),
      verify: vi.fn().mockResolvedValue(true)
    };
    setCustomTransporter(mockTransporter);

    // Clean up test bookings before each test for complete idempotency
    await prisma.booking.deleteMany({
      where: {
        customerName: { in: TEST_CUSTOMER_NAMES }
      }
    });

    // Fetch an active service for booking tests
    sampleService = await prisma.service.findFirst({ where: { isActive: true } });
  });

  afterEach(() => {
    resetCustomTransporter();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({
      where: {
        customerName: { in: TEST_CUSTOMER_NAMES }
      }
    });
  });

  describe('1. HTML Escaping, Security & Template Rendering', () => {
    it('escapes user input to prevent XSS / HTML injection in email clients', () => {
      const maliciousInput = '<script>alert("hacked")</script>&<b>bold</b>';
      const escaped = escapeHtml(maliciousInput);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;&amp;&lt;b&gt;bold&lt;/b&gt;');
      expect(escaped).not.toContain('<script>');
    });

    it('sanitizes headers against CRLF injection', () => {
      const dirtyHeader = 'Santosh\r\nBcc: evil@attacker.com\nSubject: Fake';
      const cleanHeader = sanitizeHeader(dirtyHeader);
      expect(cleanHeader).toBe('Santosh Bcc: evil@attacker.com Subject: Fake');
      expect(cleanHeader).not.toContain('\r');
      expect(cleanHeader).not.toContain('\n');
    });

    it('generates rich barber-shop themed HTML template with all required fields', () => {
      const dummyBooking = {
        id: 'uuid-12345',
        bookingReference: 'SHA-998877',
        customerName: '<John Doe>',
        customerPhone: '+91 98765 43210',
        customerEmail: 'john@example.com',
        notes: 'Needs extra <beard trim> care',
        totalPricePaise: 35000,
        totalDurationMinutes: 50,
        startTime: '2026-11-01T10:00:00.000Z',
        endTime: '2026-11-01T10:50:00.000Z',
        status: 'CONFIRMED',
        bookingServices: [
          { serviceName: 'Deluxe Haircut', durationMinutes: 30, pricePaise: 20000 },
          { serviceName: 'Beard Grooming', durationMinutes: 20, pricePaise: 15000 }
        ]
      };

      const html = generateBookingEmailHtml(dummyBooking, {
        businessName: 'Santosh Hair Art',
        barberName: 'Santosh Hair Art (Studio Barber)'
      });

      // Validates presence of all required fields
      expect(html).toContain('SHA-998877');
      expect(html).toContain('&lt;John Doe&gt;'); // HTML-escaped customer name
      expect(html).toContain('+91 98765 43210');
      expect(html).toContain('john@example.com');
      expect(html).toContain('Deluxe Haircut');
      expect(html).toContain('Beard Grooming');
      expect(html).toContain('₹350.00'); // Paired paise to rupees
      expect(html).toContain('50 minutes');
      expect(html).toContain('CONFIRMED');
      expect(html).toContain('Needs extra &lt;beard trim&gt; care'); // HTML-escaped notes
      expect(html).toContain('Santosh Hair Art (Studio Barber)');
      expect(html).not.toContain('<script>');
    });

    it('generates clean plain-text alternative matching the email content', () => {
      const dummyBooking = {
        id: 'uuid-67890',
        bookingReference: 'SHA-112233',
        customerName: 'Aarav Patel',
        customerPhone: '+91 91234 56789',
        customerEmail: 'aarav@example.com',
        notes: 'First time visit',
        totalPricePaise: 15000,
        totalDurationMinutes: 30,
        startTime: '2026-11-02T11:00:00.000Z',
        endTime: '2026-11-02T11:30:00.000Z',
        status: 'CONFIRMED',
        bookingServices: [
          { serviceName: 'Classic Cut', durationMinutes: 30, pricePaise: 15000 }
        ]
      };

      const text = generateBookingEmailText(dummyBooking);

      expect(text).toContain('Aarav Patel');
      expect(text).toContain('SHA-112233');
      expect(text).toContain('+91 91234 56789');
      expect(text).toContain('aarav@example.com');
      expect(text).toContain('Classic Cut');
      expect(text).toContain('₹150.00');
      expect(text).toContain('First time visit');
      expect(text).toContain('30 minutes');
    });
  });

  describe('2. Safe Verification & Diagnostic Testing', () => {
    it('verifySmtpConnection checks credentials safely without sending an email', async () => {
      const result = await verifySmtpConnection();
      expect(result.success).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(sentMails.length).toBe(0);
    });

    it('sendTestEmail sends a test email without creating a database appointment', async () => {
      const bookingsCountBefore = await prisma.booking.count();

      const result = await sendTestEmail('test-admin@gmail.com');
      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(sentMails[0].to).toBe('test-admin@gmail.com');
      expect(sentMails[0].subject).toContain('[Test] New Barber Appointment');

      const bookingsCountAfter = await prisma.booking.count();
      expect(bookingsCountAfter).toBe(bookingsCountBefore); // No real booking created
    });

    it('Admin can invoke GET /api/admin/email/verify and POST /api/admin/email/test', async () => {
      // 1. Login as admin
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: process.env.ADMIN_INITIAL_EMAIL || 'admin@santoshhairart.in',
          password: process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Santosh2026!'
        });
      const adminCookie = loginRes.headers['set-cookie']?.[0];
      expect(loginRes.status).toBe(200);

      // 2. Test verify endpoint
      const verifyRes = await request(app)
        .get('/api/admin/email/verify')
        .set('Cookie', adminCookie);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);

      // 3. Test test-send endpoint
      const testSendRes = await request(app)
        .post('/api/admin/email/test')
        .set('Cookie', adminCookie)
        .send({ recipient: 'custom-admin@example.com' });
      expect(testSendRes.status).toBe(200);
      expect(testSendRes.body.success).toBe(true);
      expect(testSendRes.body.data.recipient).toBe('custom-admin@example.com');
    });
  });

  describe('3. Idempotency & Duplicate Prevention', () => {
    it('does not send duplicate emails for the same booking reference', async () => {
      const dummyBooking = {
        id: 'idemp-uuid-' + Date.now(),
        bookingReference: 'SHA-IDEMP-' + Date.now(),
        customerName: 'Repeat Sender',
        customerPhone: '+91 99999 88888',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'CONFIRMED',
        bookingServices: []
      };

      const res1 = await sendBookingNotification(dummyBooking);
      expect(res1.success).toBe(true);
      expect(res1.duplicate).toBeUndefined();
      expect(sentMails.length).toBe(1);

      // Call again with the exact same booking reference
      const res2 = await sendBookingNotification(dummyBooking);
      expect(res2.success).toBe(true);
      expect(res2.duplicate).toBe(true);
      expect(sentMails.length).toBe(1); // No second mail sent
    });
  });

  describe('4. End-to-End API Integration & Failure Handling', () => {
    it('Case A: Successful booking creates record and sends notification email to BARBER_OWNER_EMAIL', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 10);
      targetDate.setHours(14, 0, 0, 0);

      const res = await request(app)
        .post('/api/public/bookings')
        .send({
          serviceIds: [sampleService.id],
          startTimeIso: targetDate.toISOString(),
          customerName: 'Amit Trivedi',
          customerPhone: '+91 98250 11223',
          customerEmail: 'amit.trivedi@example.com',
          notes: 'Fade haircut please'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingReference).toMatch(/^SHA-\d+$/);
      expect(res.body.data.notificationStatus).toBe('sent');

      // Verify email was sent
      expect(sentMails.length).toBe(1);
      const sent = sentMails[0];
      expect(sent.subject).toBe('New Barber Appointment – Amit Trivedi');
      expect(sent.html).toContain('Amit Trivedi');
      expect(sent.html).toContain(res.body.data.bookingReference);
      expect(sent.html).toContain('+919825011223');
      expect(sent.html).toContain('Fade haircut please');
    });

    it('Case B: Invalid booking fails validation and DOES NOT send any email', async () => {
      const initialMails = sentMails.length;

      const res = await request(app)
        .post('/api/public/bookings')
        .send({
          serviceIds: ['non-existent-id'],
          startTimeIso: 'invalid-date-format',
          customerName: '', // empty name
          customerPhone: '123' // invalid phone
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(sentMails.length).toBe(initialMails); // No email sent
    });

    it('Case C: Booking collision/database conflict DOES NOT send any email', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 11);
      targetDate.setHours(15, 0, 0, 0);
      const startTimeIso = targetDate.toISOString();

      // Book first
      const firstRes = await request(app)
        .post('/api/public/bookings')
        .send({
          serviceIds: [sampleService.id],
          startTimeIso,
          customerName: 'Slot Owner',
          customerPhone: '+91 98765 00001'
        });
      expect(firstRes.status).toBe(201);
      const mailCountAfterFirst = sentMails.length;

      // Try booking the exact same slot again (conflict)
      const conflictRes = await request(app)
        .post('/api/public/bookings')
        .send({
          serviceIds: [sampleService.id],
          startTimeIso,
          customerName: 'Intruder Booking',
          customerPhone: '+91 98765 00002'
        });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.code).toBe('SLOT_CONFLICT');
      // No extra email dispatched for the rejected booking
      expect(sentMails.length).toBe(mailCountAfterFirst);
    });

    it('Case D: Email delivery failure DOES NOT fail the customer booking', async () => {
      // Configure mock transporter to fail sendMail
      mockTransporter.sendMail.mockRejectedValueOnce(
        new Error('SMTP connection timed out: 554 Transaction failed')
      );

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 12);
      targetDate.setHours(16, 0, 0, 0);

      const res = await request(app)
        .post('/api/public/bookings')
        .send({
          serviceIds: [sampleService.id],
          startTimeIso: targetDate.toISOString(),
          customerName: 'Resilient Customer',
          customerPhone: '+91 98250 99887'
        });

      // Customer still receives successful 201 response with their valid booking reference
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingReference).toMatch(/^SHA-\d+$/);
      // Email failure is recorded safely without exposing stack traces or crashing
      expect(res.body.data.notificationStatus).toBe('failed');

      // Verify the booking was indeed persisted in the database
      const dbBooking = await prisma.booking.findUnique({
        where: { bookingReference: res.body.data.bookingReference }
      });
      expect(dbBooking).not.toBeNull();
      expect(dbBooking.customerName).toBe('Resilient Customer');
    });
  });
  describe('5. Customer Notifications for Admin Cancellation & Completion', () => {
    let adminCookie = '';

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: process.env.ADMIN_INITIAL_EMAIL || 'admin@santoshhairart.in',
          password: process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Santosh2026!'
        });
      adminCookie = loginRes.headers['set-cookie']?.[0];
    });

    it('Client receives cancellation email when admin cancels their appointment', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 20);
      targetDate.setHours(11, 0, 0, 0);

      const bookRes = await request(app)
        .post('/api/public/bookings')
        .send({
          serviceIds: [sampleService.id],
          startTimeIso: targetDate.toISOString(),
          customerName: 'Cancel Test Client',
          customerPhone: '9876543210',
          customerEmail: 'cancelclient@example.com'
        });

      expect(bookRes.status).toBe(201);
      const bookingRef = bookRes.body.data.bookingReference;
      const dbBooking = await prisma.booking.findUnique({
        where: { bookingReference: bookingRef }
      });

      sentMails = [];

      const patchRes = await request(app)
        .patch(`/api/admin/bookings/${dbBooking.id}`)
        .set('Cookie', adminCookie)
        .send({
          status: 'CANCELLED',
          cancellationReason: 'Barber unavailable due to emergency maintenance'
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('CANCELLED');

      await new Promise(r => setTimeout(r, 100));

      expect(sentMails.length).toBe(1);
      const sent = sentMails[0];
      expect(sent.to).toBe('cancelclient@example.com');
      expect(sent.subject).toContain('Appointment Cancelled');
      expect(sent.html).toContain('Barber unavailable due to emergency maintenance');
      expect(sent.html).toContain(bookingRef);
    });

    it('Client receives thank-you email when admin completes their appointment', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 21);
      targetDate.setHours(12, 0, 0, 0);

      const bookRes = await request(app)
        .post('/api/public/bookings')
        .send({
          serviceIds: [sampleService.id],
          startTimeIso: targetDate.toISOString(),
          customerName: 'Complete Test Client',
          customerPhone: '9876543210',
          customerEmail: 'completeclient@example.com'
        });

      expect(bookRes.status).toBe(201);
      const bookingRef = bookRes.body.data.bookingReference;
      const dbBooking = await prisma.booking.findUnique({
        where: { bookingReference: bookingRef }
      });

      sentMails = [];

      const patchRes = await request(app)
        .patch(`/api/admin/bookings/${dbBooking.id}`)
        .set('Cookie', adminCookie)
        .send({
          status: 'COMPLETED'
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('COMPLETED');

      await new Promise(r => setTimeout(r, 100));

      expect(sentMails.length).toBe(1);
      const sent = sentMails[0];
      expect(sent.to).toBe('completeclient@example.com');
      expect(sent.subject).toContain('Thank You for Visiting');
      expect(sent.html).toContain('Thank You for Visiting Santosh Hair Art!');
      expect(sent.html).toContain(bookingRef);
    });

    it('Does not attempt to send email if customer email is not provided', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 22);
      targetDate.setHours(13, 0, 0, 0);

      const bookRes = await request(app)
        .post('/api/public/bookings')
        .send({
          serviceIds: [sampleService.id],
          startTimeIso: targetDate.toISOString(),
          customerName: 'No Email Client',
          customerPhone: '9876543210'
        });

      expect(bookRes.status).toBe(201);
      const dbBooking = await prisma.booking.findUnique({
        where: { bookingReference: bookRes.body.data.bookingReference }
      });

      sentMails = [];

      const patchRes = await request(app)
        .patch(`/api/admin/bookings/${dbBooking.id}`)
        .set('Cookie', adminCookie)
        .send({ status: 'COMPLETED' });

      expect(patchRes.status).toBe(200);

      await new Promise(r => setTimeout(r, 50));
      expect(sentMails.length).toBe(0);
    });
  });
});
