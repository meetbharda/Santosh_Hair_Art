import express from 'express';
import prisma from '../lib/prisma.js';
import { getAvailableSlotsForDate, createAppointmentWithConflictCheck } from '../lib/slotEngine.js';
import { createBookingSchema, enquirySchema } from '../validators/schemas.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/public/business
 * Returns business profile, operating hours, coordinates, and contact details
 */
router.get('/business', async (req, res, next) => {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { id: 'default' }
    });

    const hours = await prisma.businessHour.findMany({
      orderBy: { dayOfWeek: 'asc' },
      include: {
        breaks: true
      }
    });

    res.json({
      success: true,
      data: {
        settings,
        hours
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/services
 * Returns active service catalog with categories
 */
router.get('/services', async (req, res, next) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/services/:id
 */
router.get('/services/:id', async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: { category: true }
    });

    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, error: 'Service not found or currently unavailable' });
    }

    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/availability
 * Query: date=YYYY-MM-DD, serviceIds=id1,id2
 */
router.get('/availability', async (req, res, next) => {
  try {
    const { date, serviceIds } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Valid date parameter in YYYY-MM-DD format is required' });
    }

    const ids = serviceIds ? String(serviceIds).split(',').filter(Boolean) : [];
    if (ids.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one serviceId is required to calculate slots' });
    }

    const services = await prisma.service.findMany({
      where: { id: { in: ids }, isActive: true }
    });

    if (services.length === 0) {
      return res.status(400).json({ success: false, error: 'Selected services were not found' });
    }

    const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);

    const slotResult = await getAvailableSlotsForDate(date, totalDuration);

    res.json({
      success: true,
      data: {
        date,
        totalDurationMinutes: totalDuration,
        ...slotResult
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/public/bookings
 * Atomic appointment reservation with double-booking conflict protection
 */
router.post('/bookings', optionalAuth, async (req, res, next) => {
  try {
    const validated = createBookingSchema.parse(req.body);

    const booking = await createAppointmentWithConflictCheck({
      serviceIds: validated.serviceIds,
      startTimeIso: validated.startTimeIso,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      customerEmail: validated.customerEmail || null,
      notes: validated.notes || null,
      userId: req.user ? req.user.id : null
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: {
        bookingReference: booking.bookingReference,
        customerName: booking.customerName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPricePaise: booking.totalPricePaise,
        totalDurationMinutes: booking.totalDurationMinutes,
        status: booking.status,
        services: booking.bookingServices
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/bookings/:reference
 * Customer booking lookup by reference (e.g. SHA-829104)
 */
router.get('/bookings/:reference', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingReference: req.params.reference.toUpperCase() },
      include: {
        bookingServices: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Appointment not found with this reference code' });
    }

    res.json({
      success: true,
      data: {
        bookingReference: booking.bookingReference,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2'), // Mask phone for privacy in public lookup
        customerEmail: booking.customerEmail ? booking.customerEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPricePaise: booking.totalPricePaise,
        totalDurationMinutes: booking.totalDurationMinutes,
        status: booking.status,
        notes: booking.notes,
        services: booking.bookingServices,
        createdAt: booking.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/public/enquiries
 * Contact form submission
 */
router.post('/enquiries', async (req, res, next) => {
  try {
    const validated = enquirySchema.parse(req.body);

    const enquiry = await prisma.enquiry.create({
      data: {
        fullName: validated.fullName,
        phone: validated.phone,
        email: validated.email || null,
        message: validated.message
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! We will contact you shortly.',
      data: { id: enquiry.id }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
