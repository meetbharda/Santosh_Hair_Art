import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, MessageSquare, Clock, Send, CheckCircle2, ExternalLink } from 'lucide-react';
import fetchApi from '../lib/api';
import { useToast } from '../context/ToastContext';

const contactSchema = z.object({
  fullName: z.string().min(2, 'Please enter your name'),
  phone: z.string().min(10, 'Please enter a valid 10-digit mobile number'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  message: z.string().min(5, 'Message must be at least 5 characters long')
});

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const verifiedPhone = '+91 95378 51649';
  const cleanPhone = '919537851649';
  const mapsUrl = 'https://maps.app.goo.gl/1NHaQgexgWuvfmq16';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await fetchApi('/public/enquiries', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      if (res.success) {
        setSubmitted(true);
        toast.success('Your message has been sent to our team!');
        reset();
      }
    } catch (err) {
      toast.error(err.message || 'Could not send message. Please try calling directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-bronze/10 border border-bronze/30 text-bronze text-xs font-semibold uppercase tracking-widest">
          <MapPin className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ivory">
          Contact & Studio Location
        </h1>
        <p className="text-sm sm:text-base text-ivory/60 leading-relaxed">
          Have an inquiry about wedding appointments, bulk styling, or finding our location? Reach out via form, phone, or direct WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Contact Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-8 space-y-6">
            <h3 className="font-serif text-2xl font-bold text-ivory">
              Studio Details
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-charcoal-900 border border-white/5 flex items-center justify-center text-bronze flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-ivory">Address</span>
                  <span className="block text-ivory/70 text-xs leading-relaxed mt-0.5">
                    Near SBI Bank, Shil, Mangrol, Gujarat, 362240
                  </span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-bronze hover:underline mt-2 font-medium"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-charcoal-900 border border-white/5 flex items-center justify-center text-bronze flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-ivory">Phone / Direct Call</span>
                  <a href={`tel:${verifiedPhone}`} className="text-bronze font-medium hover:underline text-xs block mt-0.5">
                    {verifiedPhone}
                  </a>
                  <span className="text-[11px] text-ivory/40">Available during salon hours</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-charcoal-900 border border-white/5 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-ivory">Instant WhatsApp</span>
                  <a
                    href={`https://wa.me/${cleanPhone}?text=Hello%20Santosh%20Hair%20Art,%20I%20have%20an%20inquiry.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1 bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 rounded-md text-xs font-semibold mt-1 hover:bg-emerald-900/80 transition"
                  >
                    Start Chat ↗
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-charcoal-900 border border-white/5 flex items-center justify-center text-bronze flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-ivory">Working Hours</span>
                  <span className="block text-ivory/70 text-xs mt-0.5">
                    Monday to Sunday: 9:00 AM – 9:00 PM
                  </span>
                  <span className="block text-ivory/50 text-[11px]">
                    Afternoon pause: 1:30 PM – 2:30 PM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-10 space-y-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ivory">
                Send Us a Message
              </h3>
              <p className="text-xs sm:text-sm text-ivory/60 mt-1">
                Fill out the form below and we will respond promptly during business hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-serif text-xl font-bold text-ivory">
                  Message Sent Successfully
                </h4>
                <p className="text-xs text-ivory/70 max-w-sm mx-auto">
                  Thank you for reaching out to Santosh Hair Art. We will get back to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 bg-charcoal-700 text-ivory rounded-lg text-xs font-semibold hover:bg-charcoal-600 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ivory/80 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-bronze"
                  />
                  {errors.fullName && (
                    <span className="text-[11px] text-rose-400 mt-1 block">
                      {errors.fullName.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ivory/80 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-bronze"
                    />
                    {errors.phone && (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {errors.phone.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ivory/80 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-bronze"
                    />
                    {errors.email && (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {errors.email.message}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ivory/80 mb-1">
                    Your Message / Inquiry *
                  </label>
                  <textarea
                    rows={4}
                    {...register('message')}
                    placeholder="Describe your inquiry, wedding date, or grooming requirements..."
                    className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-bronze"
                  ></textarea>
                  {errors.message && (
                    <span className="text-[11px] text-rose-400 mt-1 block">
                      {errors.message.message}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending Message...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
