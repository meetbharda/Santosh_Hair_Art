import express from 'express';
import { differenceInHours, addMinutes } from 'date-fns';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { rescheduleBookingSchema } from '../validators/schemas.js';
import { intervalsOverlap } from '../lib/slotEngine.js';

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/customer/profile
 */
router.get('/profile', async (req, res, next) => {
  try {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: {
        email: req.user.email,
        ...profile
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/customer/profile
 */
router.patch('/profile', async (req, res, next) => {
  try {
    const { fullName, phoneNumber, notes } = req.body;

    const updated = await prisma.customerProfile.upsert({
      where: { userId: req.user.id },
      update: {
        fullName: fullName?.trim(),
        phoneNumber: phoneNumber?.trim(),
        notes: notes?.trim()
      },
      create: {
        userId: req.user.id,
        fullName: fullName?.trim() || 'Valued Customer',
        phoneNumber: phoneNumber?.trim() || '',
        notes: notes?.trim()
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/customer/bookings
 */
router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { customerEmail: req.user.email }
        ]
      },
      orderBy: { startTime: 'desc' },
      include: {
        bookingServices: true
      }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/customer/bookings/:id
 */
router.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { bookingServices: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Ownership check: Customer A cannot view Customer B's bookings
    if (booking.userId !== req.user.id && booking.customerEmail !== req.user.email) {
      return res.status(403).json({ success: false, error: 'Unauthorized access to this booking.' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/customer/bookings/:id/cancel
 */
router.post('/bookings/:id/cancel', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.userId !== req.user.id && booking.customerEmail !== req.user.email) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled.' });
    }

    // Check cancellation cutoff
    const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
    const cutoffHours = settings?.cancellationCutoffHrs ?? 2;
    const hoursRemaining = differenceInHours(new Date(booking.startTime), new Date());

    if (hoursRemaining < cutoffHours) {
      return res.status(400).json({
        success: false,
        error: `Bookings cannot be cancelled less than ${cutoffHours} hours before the appointment. Please call ${settings?.phoneNumber || 'the salon'} directly.`
      });
    }

    const { reason } = req.body;

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason?.trim() || 'Cancelled by customer'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BOOKING_CANCELLED_BY_CUSTOMER',
        entityType: 'Booking',
        entityId: booking.id,
        details: JSON.stringify({ reference: booking.bookingReference, reason })
      }
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully. The slot has been released.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/customer/bookings/:id/reschedule
 */
router.post('/bookings/:id/reschedule', async (req, res, next) => {
  try {
    const validated = rescheduleBookingSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { bookingServices: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.userId !== req.user.id && booking.customerEmail !== req.user.email) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Cancelled appointments cannot be rescheduled.' });
    }

    const newStartTime = new Date(validated.newStartTimeIso);
    const newEndTime = addMinutes(newStartTime, booking.totalDurationMinutes);

    const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
    const buffer = settings?.bufferTimeMinutes || 5;
    const effectiveEnd = addMinutes(newStartTime, booking.totalDurationMinutes + buffer);

    // Atomically reschedule with conflict check
    const updated = await prisma.$transaction(async (tx) => {
      // Check collision excluding current booking
      const conflicts = await tx.booking.findMany({
        where: {
          id: { not: booking.id },
          status: { in: ['CONFIRMED', 'PENDING'] },
          startTime: { lt: effectiveEnd },
          endTime: { gt: newStartTime }
        }
      });

      if (conflicts.length > 0) {
        throw new Error('The selected new time slot is not available. Please choose another slot.');
      }

      const resched = await tx.booking.update({
        where: { id: booking.id },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          status: 'CONFIRMED'
        }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'BOOKING_RESCHEDULED_BY_CUSTOMER',
          entityType: 'Booking',
          entityId: booking.id,
          details: JSON.stringify({
            reference: booking.bookingReference,
            previousStart: booking.startTime,
            newStart: newStartTime
          })
        }
      });

      return resched;
    });

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;
