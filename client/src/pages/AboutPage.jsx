import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, ShieldCheck, Clock, Award, CheckCircle2, MapPin, Sparkles, Phone } from 'lucide-react';

export default function AboutPage() {
  const verifiedPhone = '+91 95378 51649';
  const mapsUrl = 'https://maps.app.goo.gl/1NHaQgexgWuvfmq16';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-20">
      
      {/* 1. Header & Hero Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-bronze/10 border border-bronze/30 text-bronze text-xs font-semibold uppercase tracking-widest">
            <Scissors className="w-3.5 h-3.5 -rotate-45" />
            <span>Mangrol's Grooming Destination</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ivory leading-tight">
            The Artisanal Touch at Santosh Hair Art
          </h1>

          <p className="text-base text-ivory/70 leading-relaxed">
            Nestled in the bustling heart of Mangrol near the ST Bus Station, <strong>Santosh Hair Art</strong> has established itself as a trusted sanctuary for gentlemen seeking genuine barbering precision.
          </p>

          <p className="text-base text-ivory/70 leading-relaxed">
            In an era where personal grooming is often reduced to hurried mass-production, our studio stands for unhurried craftsmanship. We honor classic barber traditions—hot towels, razor fades, and custom facial hair contouring—while welcoming clients with authentic Saurashtra warmth.
          </p>

          <div className="pt-2 flex items-center gap-6">
            <div>
              <span className="block font-serif text-2xl font-bold text-bronze">5.0 ★</span>
              <span className="block text-xs text-ivory/50">Google Rating</span>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div>
              <span className="block font-serif text-2xl font-bold text-bronze">7 Days</span>
              <span className="block text-xs text-ivory/50">Weekly Availability</span>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div>
              <span className="block font-serif text-2xl font-bold text-bronze">100%</span>
              <span className="block text-xs text-ivory/50">Hygienic Tools</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[4/3] shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1000&q=80"
              alt="Artisanal Barbershop tools and chairs at Santosh Hair Art"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 2. Pillars of Excellence */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-ivory">
            Our Studio Standards
          </h2>
          <p className="text-sm text-ivory/60 mt-2">
            Every customer who sits in our chair receives our highest commitment to quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-charcoal-800 p-8 rounded-2xl border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-bronze/10 text-bronze flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-ivory">
              Sterilization & Hygiene
            </h3>
            <p className="text-sm text-ivory/70 leading-relaxed">
              We use fresh single-use razor blades for every shave, sanitized clipper guards, clean capes, and disinfectant wipes between every single guest.
            </p>
          </div>

          <div className="bg-charcoal-800 p-8 rounded-2xl border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-bronze/10 text-bronze flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-ivory">
              Respect For Your Schedule
            </h3>
            <p className="text-sm text-ivory/70 leading-relaxed">
              By introducing our digital booking platform, we eliminate frustrating waiting benches. Your reserved slot is locked specifically for your appointment.
            </p>
          </div>

          <div className="bg-charcoal-800 p-8 rounded-2xl border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-bronze/10 text-bronze flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-ivory">
              Personalized Consultation
            </h3>
            <p className="text-sm text-ivory/70 leading-relaxed">
              We never perform cookie-cutter cuts. We discuss your hair texture, growth patterns, facial profile, and daily routine to craft the ideal style.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Common Questions (FAQ) */}
      <div className="bg-charcoal-800/40 rounded-2xl border border-white/5 p-8 sm:p-12 space-y-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory text-center">
          Frequently Asked Questions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-bronze">
              Do I have to book in advance or can I walk in?
            </h4>
            <p className="text-ivory/70 leading-relaxed">
              Walk-ins are welcomed subject to chair availability, but clients with online appointments receive priority seating. We strongly advise booking 1–2 hours in advance.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-bronze">
              Where exactly are you located in Mangrol?
            </h4>
            <p className="text-ivory/70 leading-relaxed">
              We are located near the ST Bus Station / Bus Stand Chock in Gaffar Belim, Mangrol, Gujarat (Pin Code 362225). Accessible easily on foot or by vehicle.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-bronze">
              How do cancellations and rescheduling work?
            </h4>
            <p className="text-ivory/70 leading-relaxed">
              You can cancel or reschedule directly through your online customer portal or by looking up your booking reference up to 2 hours before your appointment time.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-bronze">
              What payment methods do you accept at the salon?
            </h4>
            <p className="text-ivory/70 leading-relaxed">
              We accept UPI (Google Pay, PhonePe, Paytm), cash, and direct bank transfers upon completion of your grooming service.
            </p>
          </div>
        </div>
      </div>

      {/* 4. CTA */}
      <div className="text-center py-10 space-y-4">
        <h3 className="font-serif text-3xl font-bold text-ivory">
          Ready to experience the craft?
        </h3>
        <p className="text-sm text-ivory/60 max-w-md mx-auto">
          Reserve your preferred time slot in less than 60 seconds with instant server confirmation.
        </p>
        <div className="pt-2">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition shadow-xl shadow-bronze/10"
          >
            <span>Book Your Slot Today</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
