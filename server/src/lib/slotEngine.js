import { parse, format, addMinutes, isBefore, isAfter, areIntervalsOverlapping, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import prisma from './prisma.js';

/**
 * Checks if interval [startA, endA) overlaps with [startB, endB)
 * Using half-open intervals: [startA, endA) and [startB, endB)
 * Two intervals overlap if and only if: startA < endB AND endA > startB
 */
export function intervalsOverlap(startA, endA, startB, endB) {
  const tStartA = new Date(startA).getTime();
  const tEndA = new Date(endA).getTime();
  const tStartB = new Date(startB).getTime();
  const tEndB = new Date(endB).getTime();

  return tStartA < tEndB && tEndA > tStartB;
}

/**
 * Generates available slots for a given target date string (YYYY-MM-DD)
 * and required total duration in minutes.
 */
export async function getAvailableSlotsForDate(dateStr, totalDurationMinutes, excludeBookingId = null) {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: 'default' }
  });

  const timezone = settings?.timezone || 'Asia/Kolkata';
  const slotInterval = settings?.slotIntervalMinutes || 30;
  const leadTimeHours = settings?.leadTimeHours || 1;
  const maxAdvanceDays = settings?.maxAdvanceDays || 30;
  const globalBuffer = settings?.bufferTimeMinutes || 5;

  // Parse target date in salon timezone
  // Date string format: "YYYY-MM-DD"
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDateLocal = new Date(year, month - 1, day);
  const dayOfWeek = targetDateLocal.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Check advance window
  const now = new Date();
  const nowInSalonTz = toZonedTime(now, timezone);
  const maxBookingDate = addMinutes(nowInSalonTz, maxAdvanceDays * 24 * 60);

  if (isAfter(startOfDay(targetDateLocal), endOfDay(maxBookingDate))) {
    return {
      available: false,
      reason: `Bookings can only be made up to ${maxAdvanceDays} days in advance.`,
      slots: []
    };
  }

  // 1. Fetch Business Hours for this weekday
  const businessHour = await prisma.businessHour.findUnique({
    where: { dayOfWeek },
    include: { breaks: true }
  });

  if (!businessHour || businessHour.isClosed) {
    return {
      available: false,
      reason: 'Salon is closed on this day.',
      slots: []
    };
  }

  // Parse open and close times for target date
  const [openHour, openMin] = businessHour.openTime.split(':').map(Number);
  const [closeHour, closeMin] = businessHour.closeTime.split(':').map(Number);

  const openTimeLocal = new Date(year, month - 1, day, openHour, openMin, 0);
  const closeTimeLocal = new Date(year, month - 1, day, closeHour, closeMin, 0);

  // Convert to UTC Date objects
  const dayStartUtc = fromZonedTime(openTimeLocal, timezone);
  const dayEndUtc = fromZonedTime(closeTimeLocal, timezone);

  // 2. Fetch existing bookings that consume availability for this day range
  // We query bookings between dayStartUtc and dayEndUtc
  const existingBookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PENDING'] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startTime: { lt: dayEndUtc },
      endTime: { gt: dayStartUtc }
    }
  });

  // 3. Fetch blocked periods for this date
  const blockedPeriods = await prisma.blockedPeriod.findMany({
    where: {
      startDateTime: { lt: dayEndUtc },
      endDateTime: { gt: dayStartUtc }
    }
  });

  // 4. Prepare breaks in UTC
  const breaksUtc = businessHour.breaks.map(b => {
    const [bStartH, bStartM] = b.startTime.split(':').map(Number);
    const [bEndH, bEndM] = b.endTime.split(':').map(Number);
    const bStartLocal = new Date(year, month - 1, day, bStartH, bStartM, 0);
    const bEndLocal = new Date(year, month - 1, day, bEndH, bEndM, 0);
    return {
      name: b.name,
      start: fromZonedTime(bStartLocal, timezone),
      end: fromZonedTime(bEndLocal, timezone)
    };
  });

  // 5. Generate candidate slots from openTime to closeTime step by slotInterval
  const minimumStartTimeUtc = addMinutes(now, leadTimeHours * 60);

  const totalEffectiveDuration = totalDurationMinutes + globalBuffer;
  const slots = [];

  let currentSlotLocal = new Date(openTimeLocal);

  while (true) {
    const slotStartUtc = fromZonedTime(currentSlotLocal, timezone);
    const slotEndUtc = addMinutes(slotStartUtc, totalDurationMinutes); // appointment actual end
    const slotBufferEndUtc = addMinutes(slotStartUtc, totalEffectiveDuration); // with buffer for conflict check

    // Slot end cannot extend past closing time
    if (isAfter(slotEndUtc, dayEndUtc)) {
      break;
    }

    // Must be at least leadTime hours in the future
    const isPastLeadTime = isBefore(slotStartUtc, minimumStartTimeUtc);

    // Check collision with breaks
    const collidesWithBreak = breaksUtc.some(b =>
      intervalsOverlap(slotStartUtc, slotBufferEndUtc, b.start, b.end)
    );

    // Check collision with blocked periods
    const collidesWithBlock = blockedPeriods.some(b =>
      intervalsOverlap(slotStartUtc, slotBufferEndUtc, b.startDateTime, b.endDateTime)
    );

    // Check collision with existing active bookings
    const collidesWithBooking = existingBookings.some(b =>
      intervalsOverlap(slotStartUtc, slotBufferEndUtc, b.startTime, b.endTime)
    );

    const isAvailable = !isPastLeadTime && !collidesWithBreak && !collidesWithBlock && !collidesWithBooking;

    slots.push({
      time: format(currentSlotLocal, 'HH:mm'),
      displayTime: format(currentSlotLocal, 'hh:mm a'),
      startIso: slotStartUtc.toISOString(),
      endIso: slotEndUtc.toISOString(),
      available: isAvailable,
      reason: !isAvailable
        ? isPastLeadTime
          ? 'Passed booking cutoff time'
          : collidesWithBreak
          ? 'Break period'
          : collidesWithBlock
          ? 'Blocked by salon'
          : 'Already booked'
        : null
    });

    // Advance to next slot
    currentSlotLocal = addMinutes(currentSlotLocal, slotInterval);
    if (!isBefore(currentSlotLocal, closeTimeLocal)) {
      break;
    }
  }

  return {
    available: true,
    date: dateStr,
    timezone,
    slots
  };
}

/**
 * Validates and atomically creates an appointment inside a database transaction,
 * ensuring strict concurrency protection against double-booking.
 */
export async function createAppointmentWithConflictCheck({
  serviceIds,
  startTimeIso,
  customerName,
  customerPhone,
  customerEmail,
  notes,
  userId = null
}) {
  const startTime = new Date(startTimeIso);
  if (isNaN(startTime.getTime())) {
    throw new Error('Invalid start time format.');
  }

  // 1. Fetch services & calculate total duration & price
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
      isActive: true
    }
  });

  if (services.length !== serviceIds.length) {
    throw new Error('One or more selected services are inactive or invalid.');
  }

  const totalDurationMinutes = services.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalPricePaise = services.reduce((acc, s) => acc + s.pricePaise, 0);
  const endTime = addMinutes(startTime, totalDurationMinutes);

  const settings = await prisma.businessSettings.findUnique({
    where: { id: 'default' }
  });
  const globalBuffer = settings?.bufferTimeMinutes || 5;
  const effectiveEnd = addMinutes(startTime, totalDurationMinutes + globalBuffer);

  // 2. Perform atomic transaction
  return await prisma.$transaction(async (tx) => {
    // Check for any conflicting bookings in [startTime, effectiveEnd)
    // Note: status PENDING or CONFIRMED blocks availability
    const conflicts = await tx.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        startTime: { lt: effectiveEnd },
        endTime: { gt: startTime }
      }
    });

    if (conflicts.length > 0) {
      const err = new Error('The selected appointment time is no longer available. Please choose another time slot.');
      err.code = 'SLOT_CONFLICT';
      throw err;
    }

    // Check for blocked periods
    const blocked = await tx.blockedPeriod.findMany({
      where: {
        startDateTime: { lt: effectiveEnd },
        endDateTime: { gt: startTime }
      }
    });

    if (blocked.length > 0) {
      const err = new Error('The selected time period is blocked by the salon management.');
      err.code = 'SLOT_BLOCKED';
      throw err;
    }

    // Generate unique human-readable booking reference (e.g. SHA-829104)
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const bookingReference = `SHA-${randomSuffix}`;

    // Create booking
    const booking = await tx.booking.create({
      data: {
        bookingReference,
        userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : null,
        notes: notes ? notes.trim() : null,
        totalPricePaise,
        totalDurationMinutes,
        startTime,
        endTime,
        status: settings?.isAutoConfirm ? 'CONFIRMED' : 'PENDING',
        bookingServices: {
          create: services.map(s => ({
            serviceId: s.id,
            serviceName: s.name,
            pricePaise: s.pricePaise,
            durationMinutes: s.durationMinutes
          }))
        }
      },
      include: {
        bookingServices: true
      }
    });

    // Record audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'BOOKING_CREATED',
        entityType: 'Booking',
        entityId: booking.id,
        details: JSON.stringify({
          reference: booking.bookingReference,
          customerName: booking.customerName,
          services: services.map(s => s.name),
          totalPricePaise: booking.totalPricePaise
        })
      }
    });

    return booking;
  });
}
