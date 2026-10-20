import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Scissors,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Copy,
  Sparkles,
  Phone
} from 'lucide-react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import fetchApi from '../lib/api';
import { formatPrice, formatDuration } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('service');
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Multi-step state: 1 = Services, 2 = Date & Slot, 3 = Customer Info, 4 = Confirmation/Success
  const [step, setStep] = useState(1);

  // Data states
  const [categories, setCategories] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  // Date & Slot states
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [slotsData, setSlotsData] = useState({ loading: false, slots: [], error: null });
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Customer info states (prefill if logged in)
  const [customerName, setCustomerName] = useState(user?.profile?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.profile?.phoneNumber || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');

  // Submission & Result states
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // 1. Fetch Services
  useEffect(() => {
    fetchApi('/public/services')
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data);
          if (preselectedServiceId) {
            setSelectedServiceIds([preselectedServiceId]);
          }
        }
      })
      .catch((err) => {
        toast.error('Could not load services catalog.');
      })
      .finally(() => setLoadingServices(false));
  }, [preselectedServiceId]);

  // Update customer fields if user logs in during booking
  useEffect(() => {
    if (user) {
      if (!customerName && user.profile?.fullName) setCustomerName(user.profile.fullName);
      if (!customerPhone && user.profile?.phoneNumber) setCustomerPhone(user.profile.phoneNumber);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  // Computed selected services
  const allServices = categories.flatMap((c) => c.services);
  const selectedServices = allServices.filter((s) => selectedServiceIds.includes(s.id));
  const totalPricePaise = selectedServices.reduce((sum, s) => sum + s.pricePaise, 0);
  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  // 2. Fetch Availability when entering step 2 or date changes
  useEffect(() => {
    if (step === 2 && selectedServiceIds.length > 0 && selectedDate) {
      setSlotsData({ loading: true, slots: [], error: null });
      setSelectedSlot(null);

      fetchApi(`/public/availability?date=${selectedDate}&serviceIds=${selectedServiceIds.join(',')}`)
        .then((res) => {
          if (res.success && res.data) {
            setSlotsData({
              loading: false,
              slots: res.data.slots || [],
              error: res.data.available ? null : res.data.reason || 'Salon is closed on this date'
            });
          }
        })
        .catch((err) => {
          setSlotsData({ loading: false, slots: [], error: err.message || 'Could not fetch time slots.' });
        });
    }
  }, [step, selectedDate, selectedServiceIds]);

  // Service toggle handler
  const toggleService = (id) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter((item) => item !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  // Final booking submission
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Please select an appointment time slot.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Name and phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        serviceIds: selectedServiceIds,
        startTimeIso: selectedSlot.startIso,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: notes.trim() || undefined
      };

      const res = await fetchApi('/public/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.data) {
        setBookingResult(res.data);
        setStep(4); // Success step
        toast.success('Appointment booked successfully!');
      }
    } catch (err) {
      if (err.code === 'SLOT_CONFLICT') {
        toast.error('That slot was just booked by another customer! Please pick a new slot.');
        setStep(2); // Send back to slot picker
      } else {
        toast.error(err.message || 'Booking submission failed. Please verify your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyBookingRef = () => {
    if (bookingResult?.bookingReference) {
      navigator.clipboard.writeText(bookingResult.bookingReference);
      toast.info('Booking reference copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      
      {/* Step Indicator Header (unless at success step) */}
      {step < 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-ivory/60">
            <span className={step >= 1 ? 'text-bronze' : ''}>1. Choose Services</span>
            <span className={step >= 2 ? 'text-bronze' : ''}>2. Select Date & Slot</span>
            <span className={step >= 3 ? 'text-bronze' : ''}>3. Review & Details</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-charcoal-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-bronze transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* STEP 1: SERVICE SELECTION */}
      {step === 1 && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ivory">
              Select Your Services
            </h1>
            <p className="text-sm text-ivory/60 mt-1">
              Select one or multiple grooming rituals. You can combine haircuts, shaves, and facials.
            </p>
          </div>

          {loadingServices ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-xl skeleton"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-3">
                  <h3 className="font-serif text-xl font-bold text-bronze border-b border-white/5 pb-2">
                    {cat.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.services.map((srv) => {
                      const isSelected = selectedServiceIds.includes(srv.id);
                      return (
                        <div
                          key={srv.id}
                          onClick={() => toggleService(srv.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start justify-between gap-4 ${
                            isSelected
                              ? 'bg-bronze/10 border-bronze shadow-md'
                              : 'bg-charcoal-800 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                                  isSelected
                                    ? 'bg-bronze text-charcoal-900 border-bronze'
                                    : 'border-white/20'
                                }`}
                              >
                                {isSelected && '✓'}
                              </span>
                              <h4 className="font-serif text-base font-bold text-ivory">
                                {srv.name}
                              </h4>
                            </div>
                            <p className="text-xs text-ivory/60 line-clamp-2 pl-6">
                              {srv.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs pl-6 pt-1">
                              <span className="text-bronze font-bold">
                                {formatPrice(srv.pricePaise)}
                              </span>
                              <span className="text-ivory/50">
                                {formatDuration(srv.durationMinutes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Bar: Selection Summary */}
          <div className="sticky bottom-6 bg-charcoal-800/95 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="block text-xs text-ivory/60">
                {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} selected • {formatDuration(totalDurationMinutes)}
              </span>
              <span className="block font-serif text-2xl font-bold text-bronze">
                Total: {formatPrice(totalPricePaise)}
              </span>
            </div>

            <button
              onClick={() => {
                if (selectedServiceIds.length === 0) {
                  toast.error('Please choose at least one service to proceed.');
                  return;
                }
                setStep(2);
              }}
              disabled={selectedServiceIds.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition disabled:opacity-40"
            >
              <span>Continue to Date & Time</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DATE & SLOT SELECTION */}
      {step === 2 && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ivory">
                Choose Date & Time
              </h1>
              <p className="text-sm text-ivory/60 mt-1">
                Real-time appointment slots dynamically calculated from salon schedule.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-ivory/60 hover:text-ivory flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Services</span>
            </button>
          </div>

          {/* Date Picker Ribbon */}
          <div className="bg-charcoal-800 p-6 rounded-2xl border border-white/5 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-bronze">
              Select Appointment Date
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, idx) => {
                const d = addDays(new Date(), idx);
                const dStr = format(d, 'yyyy-MM-dd');
                const isSelected = selectedDate === dStr;
                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => setSelectedDate(dStr)}
                    className={`p-3 rounded-xl border text-center transition ${
                      isSelected
                        ? 'bg-bronze text-charcoal-900 border-bronze font-bold shadow-lg'
                        : 'bg-charcoal-900 text-ivory/80 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider opacity-70">
                      {idx === 0 ? 'Today' : format(d, 'EEE')}
                    </span>
                    <span className="block text-lg font-serif font-bold mt-0.5">
                      {format(d, 'd')}
                    </span>
                    <span className="block text-[10px] opacity-70">
                      {format(d, 'MMM')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Area */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-ivory flex items-center gap-2">
              <Clock className="w-4 h-4 text-bronze" />
              <span>Available Time Slots for {selectedDate}</span>
            </h3>

            {slotsData.loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl skeleton"></div>
                ))}
              </div>
            ) : slotsData.error ? (
              <div className="p-8 rounded-xl bg-charcoal-800 border border-white/5 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm font-semibold text-ivory">{slotsData.error}</p>
                <p className="text-xs text-ivory/50">Please select another date on the calendar.</p>
              </div>
            ) : slotsData.slots.length === 0 ? (
              <div className="p-8 rounded-xl bg-charcoal-800 border border-white/5 text-center space-y-2">
                <Clock className="w-8 h-8 text-ivory/40 mx-auto" />
                <p className="text-sm font-semibold text-ivory">No available slots on this date.</p>
                <p className="text-xs text-ivory/50">All slots may be booked or past operating hours.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {slotsData.slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 px-3 rounded-xl border text-center transition ${
                      !slot.available
                        ? 'bg-charcoal-900/40 border-white/5 text-ivory/30 cursor-not-allowed line-through'
                        : selectedSlot?.time === slot.time
                        ? 'bg-bronze text-charcoal-900 border-bronze font-bold shadow-lg scale-105'
                        : 'bg-charcoal-800 text-ivory border-white/10 hover:border-bronze hover:text-bronze'
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {slot.displayTime}
                    </span>
                    {!slot.available && (
                      <span className="block text-[9px] uppercase tracking-wider text-rose-400/80">
                        {slot.reason || 'Booked'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-charcoal-800 text-ivory/70 hover:text-ivory text-xs font-semibold border border-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={() => {
                if (!selectedSlot) {
                  toast.error('Please pick a time slot to continue.');
                  return;
                }
                setStep(3);
              }}
              disabled={!selectedSlot}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition disabled:opacity-40"
            >
              <span>Review Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CUSTOMER DETAILS & BOOKING SUMMARY */}
      {step === 3 && (
        <form onSubmit={handleConfirmBooking} className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ivory">
                Booking Summary & Contact
              </h1>
              <p className="text-sm text-ivory/60 mt-1">
                Please enter your information to confirm the appointment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-ivory/60 hover:text-ivory flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Contact Form Inputs */}
            <div className="lg:col-span-7 bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-8 space-y-4">
              <h3 className="font-serif text-xl font-bold text-ivory mb-2">
                Guest Information
              </h3>

              <div>
                <label className="block text-xs font-medium text-ivory/80 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Anand Solanki"
                  className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ivory/80 mb-1">
                  Mobile Number (for SMS / WhatsApp confirmation) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ivory/80 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. anand@example.com"
                  className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ivory/80 mb-1">
                  Notes / Haircut Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prefer skin fade on sides, trim mustache lightly..."
                  className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                ></textarea>
              </div>
            </div>

            {/* Right: Summary Card */}
            <div className="lg:col-span-5 bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-bronze mb-4">
                  Appointment Snapshot
                </h3>

                <div className="space-y-3 text-xs border-b border-white/10 pb-4 mb-4">
                  <div className="flex justify-between text-ivory/80">
                    <span>Date:</span>
                    <span className="font-bold text-ivory">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-ivory/80">
                    <span>Start Time:</span>
                    <span className="font-bold text-ivory">{selectedSlot?.displayTime}</span>
                  </div>
                  <div className="flex justify-between text-ivory/80">
                    <span>Estimated Duration:</span>
                    <span className="text-ivory">{formatDuration(totalDurationMinutes)}</span>
                  </div>
                </div>

                {/* Selected Services Breakdown */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] uppercase tracking-wider text-ivory/50 font-semibold block">
                    Services Breakdown
                  </span>
                  {selectedServices.map((srv) => (
                    <div key={srv.id} className="flex justify-between text-xs py-1">
                      <span className="text-ivory/80">{srv.name}</span>
                      <span className="font-medium text-bronze">{formatPrice(srv.pricePaise)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                  <span className="font-serif text-lg font-bold text-ivory">Total Amount</span>
                  <span className="font-serif text-2xl font-bold text-bronze">
                    {formatPrice(totalPricePaise)}
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-charcoal-900 text-[11px] text-ivory/60 space-y-1">
                  <p className="font-semibold text-ivory/80">Studio Policy:</p>
                  <p>• Pay in person at the studio via UPI or cash.</p>
                  <p>• Free cancellation or reschedule up to 2 hours before.</p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition shadow-xl shadow-bronze/10 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{submitting ? 'Reserving Slot...' : 'Confirm Appointment'}</span>
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION SCREEN */}
      {step === 4 && bookingResult && (
        <div className="max-w-xl mx-auto bg-charcoal-800 rounded-3xl border border-bronze/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block mb-1">
              Appointment Reserved & Confirmed
            </span>
            <h1 className="font-serif text-3xl font-bold text-ivory">
              Thank You, {bookingResult.customerName}!
            </h1>
            <p className="text-xs sm:text-sm text-ivory/70 mt-2">
              Your appointment at Santosh Hair Art is locked in our studio schedule.
            </p>
          </div>

          {/* Reference pill */}
          <div className="bg-charcoal-900 p-4 rounded-xl border border-white/5 flex items-center justify-between max-w-sm mx-auto">
            <div className="text-left">
              <span className="block text-[10px] uppercase text-ivory/40 font-mono">
                Booking Reference
              </span>
              <span className="font-mono text-xl font-bold text-bronze tracking-wider">
                {bookingResult.bookingReference}
              </span>
            </div>
            <button
              onClick={copyBookingRef}
              title="Copy Reference"
              className="p-2 text-ivory/60 hover:text-ivory bg-charcoal-800 rounded-lg border border-white/5 transition"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Booking Details List */}
          <div className="bg-charcoal-900/60 p-5 rounded-xl border border-white/5 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-ivory/60">Services:</span>
              <span className="font-medium text-ivory text-right">
                {bookingResult.services?.map((s) => s.serviceName).join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ivory/60">Date & Time:</span>
              <span className="font-medium text-ivory">
                {format(new Date(bookingResult.startTime), 'EEEE, MMMM d, yyyy • hh:mm a')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ivory/60">Total Estimated:</span>
              <span className="font-bold text-bronze">
                {formatPrice(bookingResult.totalPricePaise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ivory/60">Location:</span>
              <span className="font-medium text-ivory text-right">
                Near ST Bus Station, Gaffar Belim, Mangrol
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/lookup?ref=${bookingResult.bookingReference}`}
              className="flex-1 py-3 px-4 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-ivory text-xs font-semibold border border-white/10 transition"
            >
              View Appointment Card
            </Link>
            <Link
              to="/"
              className="flex-1 py-3 px-4 rounded-xl bg-bronze text-charcoal-900 text-xs font-bold hover:bg-bronze-light transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
