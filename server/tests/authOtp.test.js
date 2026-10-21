import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { setCustomTransporter, resetCustomTransporter } from '../src/services/emailService.js';
import { clearOtp, generateAndStoreOtp } from '../src/lib/otpService.js';

describe('Auth Email OTP Registration Integration Tests', () => {
  let mockTransporter;
  let sentMails = [];
  const testEmail = `otp_user_${Date.now()}@example.com`;

  beforeEach(() => {
    sentMails = [];
    mockTransporter = {
      sendMail: vi.fn().mockImplementation((mailOptions) => {
        sentMails.push(mailOptions);
        return Promise.resolve({ messageId: 'mock-otp-msg-' + Date.now() });
      }),
      verify: vi.fn().mockResolvedValue(true)
    };
    setCustomTransporter(mockTransporter);
  });

  afterEach(() => {
    resetCustomTransporter();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    clearOtp(testEmail);
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'otp_user_' } }
    });
    await prisma.$disconnect();
  });

  it('1. POST /api/auth/send-registration-otp generates code and sends email', async () => {
    const res = await request(app)
      .post('/api/auth/send-registration-otp')
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Verification code sent');

    // Transporter received the email
    expect(sentMails.length).toBe(1);
    const sent = sentMails[0];
    expect(sent.to).toBe(testEmail);
    expect(sent.subject).toMatch(/\d{6} is your Santosh Hair Art verification code/);
    expect(sent.html).toContain('Verify Your Email Address');
  });

  it('2. Rate limits rapid successive OTP requests (Cooldown enforcement)', async () => {
    // Calling immediately again should be rate-limited
    const res = await request(app)
      .post('/api/auth/send-registration-otp')
      .send({ email: testEmail });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Please wait');
  });

  it('3. Rejects registration with invalid or wrong OTP', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'Password@123',
        fullName: 'OTP Tester',
        phoneNumber: '9876543210',
        otp: '000000' // wrong OTP
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid or expired email verification code');
  });

  it('4. Successfully registers when correct OTP is provided', async () => {
    // Generate valid OTP for registration
    clearOtp(testEmail);
    const otpRes = generateAndStoreOtp(testEmail);
    expect(otpRes.success).toBe(true);
    const correctOtp = otpRes.otp;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'Password@123',
        fullName: 'OTP Tester',
        phoneNumber: '9876543210',
        otp: correctOtp
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.headers['set-cookie']).toBeDefined();

    // Verify user persisted in database
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { profile: true }
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser.profile.fullName).toBe('OTP Tester');
  });

  it('5. Cannot re-use the same OTP after account is registered (Consumed single-use)', async () => {
    const anotherEmail = `second_${Date.now()}@example.com`;
    // Attempt to register with the previous OTP
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: anotherEmail,
        password: 'Password@123',
        fullName: 'Intruder',
        phoneNumber: '9876543210',
        otp: '123456'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
