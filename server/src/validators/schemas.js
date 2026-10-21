import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  phoneNumber: z.string().min(10, 'Valid mobile number required').trim(),
  otp: z.string().regex(/^\d{6}$/, 'Verification code must be a 6-digit number').optional()
});

export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim()
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  otp: z.string().regex(/^\d{6}$/, 'Verification code must be a 6-digit number')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid reset token'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export const createBookingSchema = z.object({
  serviceIds: z.array(z.string().min(1, 'Invalid service ID')).min(1, 'Select at least one service'),
  startTimeIso: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Valid start time format required'
  }),
  customerName: z.string().min(2, 'Full name is required (at least 2 characters)').trim(),
  customerPhone: z.preprocess(
    val => (typeof val === 'string' ? val.trim() : val),
    z.string({ required_error: 'Phone number is required' })
      .transform(v => v.replace(/[\s\-\(\)\.]/g, ''))
      .refine(v => {
        return /^(\+?91|0)?[6-9]\d{9}$/.test(v) || /^\+?[1-9]\d{9,14}$/.test(v) || /^\d{10}$/.test(v);
      }, {
        message: 'Please enter a valid mobile number (at least 10 digits)'
      })
  ),
  customerEmail: z.preprocess(
    val => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val === null ? undefined : val;
    },
    z.string().email('Invalid email format').optional()
  ),
  notes: z.preprocess(
    val => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val === null ? undefined : val;
    },
    z.string().max(500, 'Notes cannot exceed 500 characters').optional()
  )
});

export const enquirySchema = z.object({
  fullName: z.string().min(2, 'Name is required').trim(),
  phone: z.string().min(10, 'Valid phone number required').trim(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  message: z.string().min(5, 'Message must be at least 5 characters').max(1000).trim()
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  cancellationReason: z.string().optional(),
  internalNotes: z.string().optional()
});

export const rescheduleBookingSchema = z.object({
  newStartTimeIso: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Valid start time required' })
});

export const serviceUpsertSchema = z.object({
  categoryId: z.string().uuid('Category is required'),
  name: z.string().min(2, 'Service name is required').trim(),
  description: z.string().optional(),
  pricePaise: z.number().int().positive('Price must be a positive integer'),
  durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes'),
  bufferMinutes: z.number().int().min(0).default(5),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0)
});

export const blockedPeriodSchema = z.object({
  title: z.string().min(2, 'Title is required').trim(),
  reason: z.string().optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  isAllDay: z.boolean().default(false)
});

export const updateSettingsSchema = z.object({
  businessName: z.string().min(2).optional(),
  tagline: z.string().optional(),
  phoneNumber: z.string().min(10).optional(),
  whatsappNumber: z.string().min(10).optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).optional(),
  googleMapsUrl: z.string().url().optional(),
  timezone: z.string().default('Asia/Kolkata'),
  slotIntervalMinutes: z.number().int().min(10).max(120).optional(),
  leadTimeHours: z.number().int().min(0).max(48).optional(),
  maxAdvanceDays: z.number().int().min(1).max(90).optional(),
  cancellationCutoffHrs: z.number().int().min(0).max(48).optional(),
  bufferTimeMinutes: z.number().int().min(0).max(60).optional(),
  currency: z.string().default('INR'),
  isAutoConfirm: z.boolean().optional()
});
