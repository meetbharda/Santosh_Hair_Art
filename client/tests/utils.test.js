import { describe, it, expect } from 'vitest';
import { formatPrice, formatDuration, capitalize, getStatusBadge } from '../src/lib/utils';

describe('Frontend Utility & Formatting Tests', () => {
  it('formats monetary values from paise to Indian Rupee symbol format', () => {
    expect(formatPrice(15000)).toMatch(/₹\s?150/);
    expect(formatPrice(12000)).toMatch(/₹\s?120/);
    expect(formatPrice(80000)).toMatch(/₹\s?800/);
    expect(formatPrice(0)).toMatch(/₹\s?0/);
  });

  it('formats duration in minutes into friendly units', () => {
    expect(formatDuration(25)).toBe('25 mins');
    expect(formatDuration(45)).toBe('45 mins');
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(90)).toBe('1 hr 30 mins');
  });

  it('returns appropriate badge styling based on booking status', () => {
    expect(getStatusBadge('CONFIRMED')).toContain('emerald');
    expect(getStatusBadge('PENDING')).toContain('amber');
    expect(getStatusBadge('CANCELLED')).toContain('rose');
    expect(getStatusBadge('COMPLETED')).toContain('blue');
    expect(getStatusBadge('NO_SHOW')).toContain('zinc');
  });

  it('capitalizes strings cleanly', () => {
    expect(capitalize('CONFIRMED')).toBe('Confirmed');
    expect(capitalize('pending')).toBe('Pending');
  });
});
