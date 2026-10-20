/**
 * Formats price stored in paise to INR string e.g. ₹150 or ₹150.00
 */
export function formatPrice(paise, showDecimals = false) {
  if (typeof paise !== 'number') return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0
  }).format(rupees);
}

/**
 * Formats duration in minutes to readable text e.g. "45 mins" or "1 hr 15 mins"
 */
export function formatDuration(minutes) {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hrs} hr ${remainingMins} mins` : `${hrs} hr`;
}

/**
 * Capitalizes string or status
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Status color badge classes
 */
export function getStatusBadge(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60';
    case 'PENDING':
      return 'bg-amber-950/80 text-amber-400 border border-amber-800/60';
    case 'COMPLETED':
      return 'bg-blue-950/80 text-blue-400 border border-blue-800/60';
    case 'CANCELLED':
      return 'bg-rose-950/80 text-rose-400 border border-rose-800/60';
    case 'NO_SHOW':
      return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    default:
      return 'bg-charcoal-700 text-ivory border border-charcoal-600';
  }
}
