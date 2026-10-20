import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  AlertCircle,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Phone,
  Plus
} from 'lucide-react';
import { format, isAfter } from 'date-fns';
import fetchApi from '../lib/api';
import { formatPrice, formatDuration, getStatusBadge } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CustomerDashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Profile edit
  const [editName, setEditName] = useState(user?.profile?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.profile?.phoneNumber || '');
  const [editNotes, setEditNotes] = useState(user?.profile?.notes || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const loadBookings = () => {
    setLoading(true);
    fetchApi('/customer/bookings')
      .then((res) => {
        if (res.success && res.data) {
          setBookings(res.data);
        }
      })
      .catch((err) => {
        toast.error('Failed to load appointments.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      loadBookings();
      setEditName(user.profile?.fullName || '');
      setEditPhone(user.profile?.phoneNumber || '');
      setEditNotes(user.profile?.notes || '');
    }
  }, [user, authLoading]);

  // Load slots for reschedule
  useEffect(() => {
    if (rescheduleBooking && newDate) {
      setLoadingSlots(true);
      setSelectedSlot(null);
      const serviceIds = rescheduleBooking.bookingServices.map(s => s.serviceId).filter(Boolean);
      fetchApi(`/public/availability?date=${newDate}&serviceIds=${serviceIds.join(',')}`)
        .then((res) => {
          if (res.success && res.data) {
            setAvailableSlots(res.data.slots || []);
          }
        })
        .catch(() => setAvailableSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [rescheduleBooking, newDate]);

  const handleCancelBooking = async (id) => {
    try {
      const res = await fetchApi(`/customer/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason || 'Cancelled by customer' })
      });
      if (res.success) {
        toast.success('Appointment cancelled. Time slot released.');
        setCancellingId(null);
        setCancelReason('');
        loadBookings();
      }
    } catch (err) {
      toast.error(err.message || 'Could not cancel booking.');
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSlot) {
      toast.error('Please select an available time slot.');
      return;
    }
    try {
      const res = await fetchApi(`/customer/bookings/${rescheduleBooking.id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ newStartTimeIso: selectedSlot.startIso })
      });
      if (res.success) {
        toast.success('Appointment rescheduled successfully!');
        setRescheduleBooking(null);
        setSelectedSlot(null);
        loadBookings();
      }
    } catch (err) {
      toast.error(err.message || 'Reschedule failed. Please choose another slot.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetchApi('/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editName,
          phoneNumber: editPhone,
          notes: editNotes
        })
      });
      if (res.success) {
        toast.success('Profile updated successfully!');
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.message || 'Could not save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => isAfter(new Date(b.startTime), now) && b.status !== 'CANCELLED'
  );
  const pastBookings = bookings.filter(
    (b) => !isAfter(new Date(b.startTime), now) || b.status === 'CANCELLED'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      
      {/* Top Banner */}
      <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-bronze font-bold block mb-1">
            Customer Dashboard
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ivory">
            Welcome back, {user?.profile?.fullName?.split(' ')[0] || 'Valued Guest'}
          </h1>
          <p className="text-xs text-ivory/60 mt-0.5">
            Signed in with {user?.email} • {user?.profile?.phoneNumber || 'No phone set'}
          </p>
        </div>

        <Link
          to="/book"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Appointment</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Appointments Area (Col 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Upcoming Section */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-ivory flex items-center gap-2">
              <Calendar className="w-4 h-4 text-bronze" />
              <span>Upcoming Appointments ({upcomingBookings.length})</span>
            </h2>

            {loading ? (
              <div className="h-32 rounded-xl skeleton"></div>
            ) : upcomingBookings.length === 0 ? (
              <div className="bg-charcoal-800/50 rounded-xl border border-white/5 p-8 text-center space-y-3">
                <p className="text-sm text-ivory/70">No upcoming appointments scheduled.</p>
                <Link
                  to="/book"
                  className="inline-block text-xs font-semibold text-bronze hover:underline"
                >
                  Schedule your haircut or groom ritual →
                </Link>
              </div>
            ) : (
              upcomingBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-charcoal-800 rounded-xl border border-white/5 hover:border-bronze/40 p-6 space-y-4 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-ivory/40 uppercase block">Ref Code</span>
                      <span className="font-mono text-base font-bold text-bronze">
                        {b.bookingReference}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadge(b.status)} self-start sm:self-auto`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-ivory/50 block">Date & Time</span>
                      <span className="font-bold text-ivory text-sm">
                        {format(new Date(b.startTime), 'EEEE, MMM d, yyyy')}
                      </span>
                      <span className="text-bronze font-medium">
                        {format(new Date(b.startTime), 'hh:mm a')} – {format(new Date(b.endTime), 'hh:mm a')}
                      </span>
                    </div>

                    <div>
                      <span className="text-ivory/50 block">Services & Total</span>
                      <span className="font-medium text-ivory">
                        {b.bookingServices.map((s) => s.serviceName).join(', ')}
                      </span>
                      <span className="block font-bold text-bronze text-sm mt-0.5">
                        {formatPrice(b.totalPricePaise)}
                      </span>
                    </div>
                  </div>

                  {b.notes && (
                    <div className="p-3 bg-charcoal-900 rounded-lg text-xs text-ivory/70">
                      <span className="font-semibold text-ivory">Instructions:</span> {b.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => setRescheduleBooking(b)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-ivory text-xs font-semibold transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-bronze" />
                      <span>Reschedule</span>
                    </button>

                    <button
                      onClick={() => setCancellingId(b.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-950/70 border border-rose-800/40 text-xs font-semibold transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Past History */}
          <div className="space-y-4 pt-4">
            <h2 className="font-serif text-xl font-bold text-ivory flex items-center gap-2">
              <Clock className="w-4 h-4 text-ivory/50" />
              <span>Appointment History ({pastBookings.length})</span>
            </h2>

            {pastBookings.length === 0 ? (
              <p className="text-xs text-ivory/40">No past bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {pastBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-charcoal-800/60 rounded-lg border border-white/5 p-4 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-bronze font-bold mr-3">{b.bookingReference}</span>
                      <span className="text-ivory/70 font-medium mr-3">
                        {format(new Date(b.startTime), 'MMM d, yyyy')}
                      </span>
                      <span className="text-ivory/50">
                        {b.bookingServices.map((s) => s.serviceName).join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-ivory">{formatPrice(b.totalPricePaise)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right: Profile Edit Card (Col 4) */}
        <div className="lg:col-span-4">
          <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-ivory flex items-center gap-2">
              <User className="w-4 h-4 text-bronze" />
              <span>Guest Profile</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-ivory/70 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs text-ivory focus:outline-none focus:border-bronze"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ivory/70 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs text-ivory focus:outline-none focus:border-bronze"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ivory/70 mb-1">
                  Hair & Style Preferences (Saved for future bookings)
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Skin fade #1 on sides, keep beard natural..."
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs text-ivory focus:outline-none focus:border-bronze"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 bg-bronze text-charcoal-900 font-bold text-xs rounded-lg hover:bg-bronze-light transition disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Cancellation Dialog Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-800 rounded-2xl border border-white/10 p-6 max-w-sm w-full space-y-4">
            <h3 className="font-serif text-lg font-bold text-ivory">
              Cancel Appointment?
            </h3>
            <p className="text-xs text-ivory/70 leading-relaxed">
              Are you sure you want to cancel this booking? The time slot will immediately be released for other clients.
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs text-ivory focus:outline-none focus:border-bronze"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setCancellingId(null)}
                className="px-4 py-2 text-xs text-ivory/60 hover:text-ivory"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(cancellingId)}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-800 rounded-2xl border border-white/10 p-6 sm:p-8 max-w-lg w-full space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl font-bold text-ivory">
                  Reschedule Appointment
                </h3>
                <p className="text-xs text-ivory/60 mt-0.5">
                  Reference: <span className="text-bronze font-mono">{rescheduleBooking.bookingReference}</span>
                </p>
              </div>
              <button
                onClick={() => setRescheduleBooking(null)}
                className="text-ivory/50 hover:text-ivory"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ivory mb-2">
                Select New Date
              </label>
              <input
                type="date"
                value={newDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ivory">
                Available Time Slots
              </label>
              {loadingSlots ? (
                <div className="text-xs text-ivory/50">Loading real-time availability...</div>
              ) : availableSlots.length === 0 ? (
                <div className="text-xs text-amber-400">No open slots on this date.</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-lg text-xs border text-center transition ${
                        !slot.available
                          ? 'opacity-30 line-through border-white/5 cursor-not-allowed'
                          : selectedSlot?.time === slot.time
                          ? 'bg-bronze text-charcoal-900 border-bronze font-bold'
                          : 'bg-charcoal-900 text-ivory border-white/10 hover:border-bronze'
                      }`}
                    >
                      {slot.displayTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setRescheduleBooking(null)}
                className="px-4 py-2 text-xs text-ivory/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRescheduleSubmit}
                disabled={!selectedSlot}
                className="px-5 py-2.5 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition disabled:opacity-40"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
