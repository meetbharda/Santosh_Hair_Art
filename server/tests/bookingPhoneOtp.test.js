import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { setCustomTransporter, resetCustomTransporter } from '../src/services/emailService.js';
import { clearPhoneOtp, generateAndStorePhoneOtp } from '../src/lib/otpService.js';

describe('Public Booking Phone OTP Verification Integration Tests', () => {
  let sampleService;
  let mockTransporter;
  let sentMails = [];
  const testPhone = '+91 99887 76655';
  const normalizedPhone = '+919988776655';

  beforeEach(async () => {
    sentMails = [];
    mockTransporter = {
      sendMail: vi.fn().mockImplementation((mailOptions) => {
        sentMails.push(mailOptions);
        return Promise.resolve({ messageId: 'mock-phone-otp-' + Date.now() });
      }),
      verify: vi.fn().mockResolvedValue(true)
    };
    setCustomTransporter(mockTransporter);

    sampleService = await prisma.service.findFirst({ where: { isActive: true } });
  });

  afterEach(() => {
    resetCustomTransporter();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    clearPhoneOtp(testPhone);
    await prisma.booking.deleteMany({
      where: { customerName: 'Phone OTP Test User' }
    });
    await prisma.$disconnect();
  });

  it('1. POST /api/public/bookings/send-phone-otp generates OTP and delivers email copy if email supplied', async () => {
    clearPhoneOtp(testPhone);

    const res = await request(app)
      .post('/api/public/bookings/send-phone-otp')
      .send({
        customerPhone: testPhone,
        customerEmail: 'phoneotp@example.com'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe(normalizedPhone);
    expect(res.body.data.devOtp).toMatch(/^\d{6}$/);

    // Transporter received email with the OTP code
    expect(sentMails.length).toBe(1);
    expect(sentMails[0].to).toBe('phoneotp@example.com');
    expect(sentMails[0].subject).toContain('appointment verification code');
    expect(sentMails[0].html).toContain(res.body.data.devOtp);
  });

  it('2. Rate limits rapid repeated phone OTP requests (Cooldown enforcement)', async () => {
    // Calling immediately again should return 429
    const res = await request(app)
      .post('/api/public/bookings/send-phone-otp')
      .send({
        customerPhone: testPhone
      });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Please wait');
  });

  it('3. Rejects booking reservation when wrong phone OTP is supplied', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 25);
    targetDate.setHours(14, 0, 0, 0);

    const res = await request(app)
      .post('/api/public/bookings')
      .send({
        serviceIds: [sampleService.id],
        startTimeIso: targetDate.toISOString(),
        customerName: 'Phone OTP Test User',
        customerPhone: testPhone,
        phoneOtp: '000000' // wrong OTP
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid or expired mobile verification code');
  });

  it('4. Successfully confirms reservation when correct phone OTP is supplied', async () => {
    // Generate valid phone OTP
    clearPhoneOtp(testPhone);
    const otpRes = generateAndStorePhoneOtp(testPhone);
    expect(otpRes.success).toBe(true);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 26);
    targetDate.setHours(15, 0, 0, 0);

    const res = await request(app)
      .post('/api/public/bookings')
      .send({
        serviceIds: [sampleService.id],
        startTimeIso: targetDate.toISOString(),
        customerName: 'Phone OTP Test User',
        customerPhone: testPhone,
        phoneOtp: otpRes.otp
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingReference).toMatch(/^SHA-\d+$/);

    // Verify booking in database
    const dbBooking = await prisma.booking.findUnique({
      where: { bookingReference: res.body.data.bookingReference }
    });
    expect(dbBooking).not.toBeNull();
    expect(dbBooking.customerName).toBe('Phone OTP Test User');
  });

  it('5. Consumes phone OTP upon booking confirmation (Single-use)', async () => {
    // Attempting to book again with same OTP should fail
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 27);
    targetDate.setHours(16, 0, 0, 0);

    const res = await request(app)
      .post('/api/public/bookings')
      .send({
        serviceIds: [sampleService.id],
        startTimeIso: targetDate.toISOString(),
        customerName: 'Phone OTP Test User',
        customerPhone: testPhone,
        phoneOtp: '123456'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
