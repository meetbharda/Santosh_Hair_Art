import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { intervalsOverlap } from '../src/lib/slotEngine.js';

describe('Santosh Hair Art — Comprehensive Backend Test Suite', () => {
  let adminCookie = '';
  let customerCookie = '';
  let otherCustomerCookie = '';
  let sampleServiceId = '';
  let customerBookingId = '';
  let customerBookingRef = '';

  beforeAll(async () => {
    // Clean up test bookings from prior runs so tests are completely idempotent
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { customerName: { in: ['User One', 'User Two', 'Rajesh Sharma', 'Another Customer', 'Test Price Immutable'] } },
          { customerEmail: { in: ['rajesh@example.com', 'another@example.com'] } },
          { bookingReference: { startsWith: 'TEST-IMM-' } }
        ]
      }
    });

    // Ensure DB connection is active and seed data is present
    const service = await prisma.service.findFirst({ where: { isActive: true } });
    if (service) {
      sampleServiceId = service.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.database).toBe('connected');
  });

  it('2. Customer can register and log in', async () => {
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'Password@123',
        fullName: 'Rajesh Sharma',
        phoneNumber: '+91 98989 89898'
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.headers['set-cookie']).toBeDefined();

    customerCookie = regRes.headers['set-cookie'][0];

    // Login with same user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password@123'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.email).toBe(testEmail);
  });

  it('3. Admin can log in with verified seed credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_INITIAL_EMAIL || 'admin@santoshhairart.in',
        password: process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Santosh2026!'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('ADMIN');
    expect(res.headers['set-cookie']).toBeDefined();
    adminCookie = res.headers['set-cookie'][0];
  });

  it('4. Public can browse active services and business profile', async () => {
    const bizRes = await request(app).get('/api/public/business');
    expect(bizRes.status).toBe(200);
    expect(bizRes.body.data.settings.businessName).toBe('Santosh Hair Art');

    const srvRes = await request(app).get('/api/public/services');
    expect(srvRes.status).toBe(200);
    expect(Array.isArray(srvRes.body.data)).toBe(true);
    expect(srvRes.body.data.length).toBeGreaterThan(0);
  });

  it('5. Public can calculate dynamic available slots for a future date', async () => {
    // Pick tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .get(`/api/public/availability?date=${dateStr}&serviceIds=${sampleServiceId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slots.length).toBeGreaterThan(0);
    expect(res.body.data.slots.some(s => s.available)).toBe(true);
  });

  it('6. Customer can book an available slot', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(10, 0, 0, 0); // 10:00 AM
    const startTimeIso = targetDate.toISOString();

    const bookRes = await request(app)
      .post('/api/public/bookings')
      .set('Cookie', customerCookie)
      .send({
        serviceIds: [sampleServiceId],
        startTimeIso,
        customerName: 'Rajesh Sharma',
        customerPhone: '+91 98989 89898',
        customerEmail: 'rajesh@example.com',
        notes: 'First time visiting'
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.success).toBe(true);
    expect(bookRes.body.data.bookingReference).toMatch(/^SHA-\d+$/);

    customerBookingId = bookRes.body.data.bookingReference;
    customerBookingRef = bookRes.body.data.bookingReference;
  });

  it('7. A second conflicting booking is rejected (Prevent double booking)', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(10, 0, 0, 0); // exact same time
    const startTimeIso = targetDate.toISOString();

    const conflictRes = await request(app)
      .post('/api/public/bookings')
      .send({
        serviceIds: [sampleServiceId],
        startTimeIso,
        customerName: 'Another Customer',
        customerPhone: '+91 91234 56789',
        customerEmail: 'another@example.com'
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.code).toBe('SLOT_CONFLICT');
  });

  it('8. Simultaneous concurrent booking requests: only ONE succeeds', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 4);
    targetDate.setHours(11, 0, 0, 0);
    const startTimeIso = targetDate.toISOString();

    const req1 = request(app)
      .post('/api/public/bookings')
      .send({
        serviceIds: [sampleServiceId],
        startTimeIso,
        customerName: 'User One',
        customerPhone: '+91 99999 11111'
      });

    const req2 = request(app)
      .post('/api/public/bookings')
      .send({
        serviceIds: [sampleServiceId],
        startTimeIso,
        customerName: 'User Two',
        customerPhone: '+91 99999 22222'
      });

    const results = await Promise.all([req1, req2]);
    const statuses = results.map(r => r.status).sort();

    // Exactly one should be 201 (Created), and one should be 409 (Conflict)
    expect(statuses).toEqual([201, 409]);
  });

  it('9. Non-admin users cannot access admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', customerCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('10. Admin can access dashboard and view metrics', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.servicesCount).toBeGreaterThan(0);
  });

  it('11. Customer A cannot view Customer B bookings', async () => {
    // Register Customer B
    const bEmail = `customer_b_${Date.now()}@example.com`;
    const regB = await request(app)
      .post('/api/auth/register')
      .send({
        email: bEmail,
        password: 'Password@123',
        fullName: 'Customer B',
        phoneNumber: '+91 97777 88888'
      });
    otherCustomerCookie = regB.headers['set-cookie'][0];

    // Find a booking belonging to Customer A
    const custABooking = await prisma.booking.findFirst({
      where: { customerName: 'Rajesh Sharma' }
    });

    if (custABooking) {
      const accessRes = await request(app)
        .get(`/api/customer/bookings/${custABooking.id}`)
        .set('Cookie', otherCustomerCookie);

      expect(accessRes.status).toBe(403);
    }
  });

  it('12. Historical prices remain immutable when a service is updated', async () => {
    const srv = await prisma.service.findFirst({ where: { isActive: true } });
    const originalPrice = srv.pricePaise;

    // Create a booking with original price
    const booking = await prisma.booking.create({
      data: {
        bookingReference: `TEST-IMM-${Date.now()}`,
        customerName: 'Test Price Immutable',
        customerPhone: '+91 90000 00000',
        totalPricePaise: originalPrice,
        totalDurationMinutes: srv.durationMinutes,
        startTime: new Date(Date.now() + 100000000),
        endTime: new Date(Date.now() + 100000000 + 1800000),
        bookingServices: {
          create: [{
            serviceId: srv.id,
            serviceName: srv.name,
            pricePaise: originalPrice,
            durationMinutes: srv.durationMinutes
          }]
        }
      },
      include: { bookingServices: true }
    });

    // Admin updates the service price to higher
    const newPrice = originalPrice + 10000;
    await request(app)
      .patch(`/api/admin/services/${srv.id}`)
      .set('Cookie', adminCookie)
      .send({ pricePaise: newPrice });

    // Historical booking price MUST remain originalPrice
    const checkBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { bookingServices: true }
    });

    expect(checkBooking.totalPricePaise).toBe(originalPrice);
    expect(checkBooking.bookingServices[0].pricePaise).toBe(originalPrice);
  });
});
