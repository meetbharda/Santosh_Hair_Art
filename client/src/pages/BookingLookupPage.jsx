import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Calendar, Clock, MapPin, Scissors, Phone, AlertCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import fetchApi from '../lib/api';
import { formatPrice, formatDuration, getStatusBadge } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export default function BookingLookupPage() {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const [reference, setReference] = useState(initialRef);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const toast = useToast();

  const handleSearch = async (refCode) => {
    const code = (refCode || reference).trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a booking reference code.');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetchApi(`/public/bookings/${code}`);
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        setBooking(null);
      }
    } catch (err) {
      setBooking(null);
      toast.error(err.message || 'No appointment found with that code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      handleSearch(initialRef);
    }
  }, [initialRef]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ivory">
          Find Your Appointment
        </h1>
        <p className="text-xs sm:text-sm text-ivory/60 max-w-md mx-auto">
          Enter the booking reference code (e.g. SHA-829104) provided during your appointment reservation.
        </p>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ivory/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. SHA-123456"
            className="w-full pl-11 pr-4 py-3 bg-charcoal-800 border border-white/10 rounded-xl text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-bronze uppercase tracking-wider font-mono font-semibold"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition shadow-md disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Lookup'}
        </button>
      </form>

      {/* Result Card */}
      {searched && (
        booking ? (
          <div className="bg-charcoal-800 rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6 animate-fade-in shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-ivory/50 block">Reference</span>
                <span className="font-mono text-2xl font-bold text-bronze tracking-wider">
                  {booking.bookingReference}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(booking.status)}`}>
                {booking.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-ivory/50">Guest Name</span>
                <span className="block font-bold text-sm text-ivory">{booking.customerName}</span>
              </div>

              <div className="space-y-1">
                <span className="text-ivory/50">Scheduled Slot</span>
                <span className="block font-bold text-sm text-ivory">
                  {format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy')}
                </span>
                <span className="block text-bronze font-semibold">
                  {format(new Date(booking.startTime), 'hh:mm a')} – {format(new Date(booking.endTime), 'hh:mm a')}
                </span>
              </div>
            </div>

            {/* Services snapshot */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <span className="text-[11px] uppercase tracking-wider text-ivory/50 font-semibold block">
                Booked Services
              </span>
              {booking.services?.map((s) => (
                <div key={s.id} className="flex justify-between text-xs py-1">
                  <span className="text-ivory/80">{s.serviceName}</span>
                  <span className="text-bronze font-medium">{formatPrice(s.pricePaise)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5 flex justify-between font-bold text-sm">
                <span className="text-ivory">Total Amount (Pay at salon):</span>
                <span className="text-bronze text-base">{formatPrice(booking.totalPricePaise)}</span>
              </div>
            </div>

            {/* Location & Contact Helper */}
            <div className="bg-charcoal-900 p-4 rounded-xl text-xs space-y-2 text-ivory/70 border border-white/5">
              <div className="flex items-center gap-2 text-ivory font-semibold">
                <MapPin className="w-4 h-4 text-bronze" />
                <span>Santosh Hair Art Studio Location</span>
              </div>
              <p>Near ST Bus Station, Chock, Gaffar Belim, Mangrol, Gujarat 362225</p>
              <div className="pt-1 flex items-center justify-between">
                <a
                  href="https://maps.app.goo.gl/1NHaQgexgWuvfmq16"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bronze hover:underline font-medium"
                >
                  Get Directions in Google Maps ↗
                </a>
                <a href="tel:+919537851649" className="text-ivory hover:underline">
                  Call: +91 95378 51649
                </a>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="bg-charcoal-800/40 rounded-2xl border border-white/5 p-10 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-ivory">No Booking Found</h3>
              <p className="text-xs text-ivory/60 max-w-sm mx-auto">
                We couldn't find an appointment matching "{reference}". Please verify the code or check with your mobile number.
              </p>
            </div>
          )
        )
      )}

    </div>
  );
}
