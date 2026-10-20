import express from 'express';
import { startOfDay, endOfDay, subDays, addDays, parseISO, addMinutes } from 'date-fns';
import prisma from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  serviceUpsertSchema,
  updateBookingStatusSchema,
  blockedPeriodSchema,
  updateSettingsSchema
} from '../validators/schemas.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/dashboard
 * Real database-backed metrics
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [
      todayCount,
      upcomingCount,
      completedCount,
      pendingCount,
      cancelledCount,
      completedBookings,
      recentBookings,
      servicesCount,
      popularServicesData
    ] = await Promise.all([
      // Today's appointments
      prisma.booking.count({
        where: {
          startTime: { gte: todayStart, lte: todayEnd },
          status: { not: 'CANCELLED' }
        }
      }),
      // Upcoming bookings
      prisma.booking.count({
        where: {
          startTime: { gte: now },
          status: { in: ['CONFIRMED', 'PENDING'] }
        }
      }),
      // Completed bookings
      prisma.booking.count({
        where: { status: 'COMPLETED' }
      }),
      // Pending confirmations
      prisma.booking.count({
        where: { status: 'PENDING' }
      }),
      // Cancellations
      prisma.booking.count({
        where: { status: 'CANCELLED' }
      }),
      // Total revenue from completed bookings
      prisma.booking.findMany({
        where: { status: 'COMPLETED' },
        select: { totalPricePaise: true }
      }),
      // 10 most recent bookings
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { bookingServices: true }
      }),
      // Total active services
      prisma.service.count({
        where: { isActive: true }
      }),
      // Popular services count
      prisma.bookingService.groupBy({
        by: ['serviceName'],
        _count: { serviceName: true },
        orderBy: { _count: { serviceName: 'desc' } },
        take: 5
      })
    ]);

    const totalRevenuePaise = completedBookings.reduce((sum, b) => sum + b.totalPricePaise, 0);

    res.json({
      success: true,
      data: {
        metrics: {
          todayCount,
          upcomingCount,
          completedCount,
          pendingCount,
          cancelledCount,
          totalRevenuePaise,
          totalRevenueRupees: (totalRevenuePaise / 100).toFixed(2),
          servicesCount
        },
        recentBookings,
        popularServices: popularServicesData.map(ps => ({
          name: ps.serviceName,
          count: ps._count.serviceName
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/bookings
 * Filters: date, status, search, page, limit
 */
router.get('/bookings', async (req, res, next) => {
  try {
    const { date, status, search, limit = '50', page = '1' } = req.query;

    const where = {};

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const d = parseISO(date);
      where.startTime = {
        gte: startOfDay(d),
        lte: endOfDay(d)
      };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { bookingReference: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search } }
      ];
    }

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        take,
        skip,
        orderBy: { startTime: 'desc' },
        include: {
          bookingServices: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        page: parseInt(page, 10) || 1,
        limit: take,
        bookings
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/bookings/:id
 */
router.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        bookingServices: true,
        user: { select: { id: true, email: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/bookings/:id
 * Status change, internal notes, cancellation
 */
router.patch('/bookings/:id', async (req, res, next) => {
  try {
    const validated = updateBookingStatusSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: validated.status,
        cancellationReason: validated.cancellationReason || booking.cancellationReason,
        internalNotes: validated.internalNotes !== undefined ? validated.internalNotes : booking.internalNotes
      },
      include: { bookingServices: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `BOOKING_STATUS_${validated.status}`,
        entityType: 'Booking',
        entityId: booking.id,
        details: JSON.stringify({
          previousStatus: booking.status,
          newStatus: validated.status,
          internalNotes: validated.internalNotes
        })
      }
    });

    res.json({
      success: true,
      message: `Booking updated to ${validated.status}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/services
 */
router.get('/services', async (req, res, next) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        services: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/services
 */
router.post('/services', async (req, res, next) => {
  try {
    const validated = serviceUpsertSchema.parse(req.body);

    const service = await prisma.service.create({
      data: validated
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_CREATED',
        entityType: 'Service',
        entityId: service.id,
        details: JSON.stringify({ name: service.name, pricePaise: service.pricePaise })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/services/:id
 */
router.patch('/services/:id', async (req, res, next) => {
  try {
    const validated = serviceUpsertSchema.partial().parse(req.body);

    const existing = await prisma.service.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: validated
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_UPDATED',
        entityType: 'Service',
        entityId: updated.id,
        details: JSON.stringify(validated)
      }
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/services/:id
 * Safe archive (toggles isActive to false to preserve historical booking integrity)
 */
router.delete('/services/:id', async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // Toggle active status
    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: !service.isActive }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: updated.isActive ? 'SERVICE_ACTIVATED' : 'SERVICE_DEACTIVATED',
        entityType: 'Service',
        entityId: service.id,
        details: JSON.stringify({ name: service.name, isActive: updated.isActive })
      }
    });

    res.json({
      success: true,
      message: `Service marked as ${updated.isActive ? 'active' : 'inactive'}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/business-hours
 */
router.get('/business-hours', async (req, res, next) => {
  try {
    const hours = await prisma.businessHour.findMany({
      orderBy: { dayOfWeek: 'asc' },
      include: { breaks: true }
    });

    res.json({ success: true, data: hours });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/business-hours
 */
router.put('/business-hours', async (req, res, next) => {
  try {
    const { hours } = req.body;
    if (!Array.isArray(hours)) {
      return res.status(400).json({ success: false, error: 'Hours array required' });
    }

    // Update each day in a transaction
    await prisma.$transaction(
      hours.map(h =>
        prisma.businessHour.upsert({
          where: { dayOfWeek: h.dayOfWeek },
          update: {
            isClosed: h.isClosed,
            openTime: h.openTime,
            closeTime: h.closeTime
          },
          create: {
            dayOfWeek: h.dayOfWeek,
            isClosed: h.isClosed,
            openTime: h.openTime,
            closeTime: h.closeTime
          }
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BUSINESS_HOURS_UPDATED',
        entityType: 'BusinessHour',
        details: JSON.stringify(hours)
      }
    });

    const updated = await prisma.businessHour.findMany({
      orderBy: { dayOfWeek: 'asc' },
      include: { breaks: true }
    });

    res.json({
      success: true,
      message: 'Business hours updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/blocked-periods
 */
router.get('/blocked-periods', async (req, res, next) => {
  try {
    const blocks = await prisma.blockedPeriod.findMany({
      orderBy: { startDateTime: 'asc' }
    });
    res.json({ success: true, data: blocks });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/blocked-periods
 */
router.post('/blocked-periods', async (req, res, next) => {
  try {
    const validated = blockedPeriodSchema.parse(req.body);

    const block = await prisma.blockedPeriod.create({
      data: {
        title: validated.title,
        reason: validated.reason,
        startDateTime: new Date(validated.startDateTime),
        endDateTime: new Date(validated.endDateTime),
        isAllDay: validated.isAllDay
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BLOCKED_PERIOD_CREATED',
        entityType: 'BlockedPeriod',
        entityId: block.id,
        details: JSON.stringify(validated)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Blocked period created successfully',
      data: block
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/blocked-periods/:id
 */
router.delete('/blocked-periods/:id', async (req, res, next) => {
  try {
    await prisma.blockedPeriod.delete({
      where: { id: req.params.id }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BLOCKED_PERIOD_DELETED',
        entityType: 'BlockedPeriod',
        entityId: req.params.id
      }
    });

    res.json({ success: true, message: 'Blocked period removed successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/settings
 */
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { id: 'default' }
    });
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/settings
 */
router.patch('/settings', async (req, res, next) => {
  try {
    const validated = updateSettingsSchema.parse(req.body);

    const updated = await prisma.businessSettings.upsert({
      where: { id: 'default' },
      update: validated,
      create: {
        id: 'default',
        ...validated
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BUSINESS_SETTINGS_UPDATED',
        entityType: 'BusinessSettings',
        entityId: 'default',
        details: JSON.stringify(validated)
      }
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/customers
 */
router.get('/customers', async (req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        profile: true,
        bookings: {
          select: {
            id: true,
            bookingReference: true,
            startTime: true,
            status: true,
            totalPricePaise: true
          },
          orderBy: { startTime: 'desc' }
        }
      }
    });

    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/enquiries
 */
router.get('/enquiries', async (req, res, next) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: enquiries });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/enquiries/:id
 */
router.patch('/enquiries/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await prisma.enquiry.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/audit-logs
 */
router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true } }
      }
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
