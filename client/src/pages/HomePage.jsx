import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Phone,
  MessageSquare,
  Award
} from 'lucide-react';
import fetchApi from '../lib/api';
import { formatPrice, formatDuration } from '../lib/utils';

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/public/services')
      .then((res) => {
        if (res.success && res.data) {
          // Flatten first 4 featured services
          const flat = [];
          res.data.forEach((cat) => {
            cat.services.forEach((s) => flat.push({ ...s, categoryName: cat.name }));
          });
          setServices(flat.slice(0, 4));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const verifiedPhone = '+91 95378 51649';
  const cleanPhone = '919537851649';
  const mapsUrl = 'https://maps.app.goo.gl/1NHaQgexgWuvfmq16';

  return (
    <div className="space-y-24 sm:space-y-32 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-12 pb-20">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(197,160,89,0.12),transparent_70%)] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bronze/10 border border-bronze/30 text-bronze text-xs font-semibold uppercase tracking-widest mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Grooming & Hair Artistry • Mangrol, Gujarat</span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ivory max-w-4xl mx-auto leading-[1.1] mb-6">
            Classic Barber Craft. <br />
            <span className="italic font-normal text-bronze">Modern Precision.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-ivory/70 max-w-2xl mx-auto leading-relaxed mb-10">
            Welcome to <strong className="text-ivory">Santosh Hair Art</strong>, Mangrol’s premier men's hair studio. 
            Experience tailored haircuts, razor-sharp beard styling, and revitalizing grooming rituals in a welcoming, unhurried atmosphere.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/book"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-bronze text-charcoal-900 font-bold text-base hover:bg-bronze-light transition duration-200 shadow-xl shadow-bronze/20 active:scale-95"
            >
              <Calendar className="w-5 h-5" />
              <span>Book Appointment</span>
            </Link>

            <Link
              to="/services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-charcoal-800 text-ivory hover:text-bronze font-semibold text-base border border-white/10 hover:border-bronze/30 transition duration-200"
            >
              <span>Explore Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Key Facts bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 pt-8 border-t border-white/10 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-charcoal-800 border border-white/5 flex items-center justify-center text-bronze">
                <Star className="w-5 h-5 fill-bronze" />
              </div>
              <div>
                <span className="block font-bold text-ivory text-sm">5.0 Star Rated</span>
                <span className="block text-xs text-ivory/50">Google Maps Verified</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-charcoal-800 border border-white/5 flex items-center justify-center text-bronze">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-ivory text-sm">Near SBI Bank</span>
                <span className="block text-xs text-ivory/50">Shil, 362240</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-charcoal-800 border border-white/5 flex items-center justify-center text-bronze">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-ivory text-sm">Open 7 Days</span>
                <span className="block text-xs text-ivory/50">9:00 AM – 9:00 PM</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-charcoal-800 border border-white/5 flex items-center justify-center text-bronze">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-ivory text-sm">Clean & Sanitized</span>
                <span className="block text-xs text-ivory/50">Sterilized Tools Always</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. BRAND STORY & PHILOSOPHY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80"
                alt="Master Barber Styling at Santosh Hair Art"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 via-transparent to-transparent"></div>
            </div>
            
            {/* Experience overlay badge */}
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-charcoal-800 border border-bronze/40 p-4 rounded-xl shadow-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-bronze/10 text-bronze flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-ivory/60 font-medium">Commitment</span>
                <span className="block font-serif text-lg font-bold text-bronze">Artisanal Grooming</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-bronze font-bold">
              <Scissors className="w-3.5 h-3.5 -rotate-45" />
              <span>The Studio Philosophy</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ivory leading-tight">
              Where Precision Meets Traditional Saurashtra Hospitality
            </h2>

            <p className="text-sm sm:text-base text-ivory/70 leading-relaxed">
              Located strategically near the ST Bus Station in Mangrol, <strong>Santosh Hair Art</strong> was founded with one clear purpose: to deliver meticulous haircutting and beard grooming that respects your time and elevates your personal style.
            </p>

            <p className="text-sm sm:text-base text-ivory/70 leading-relaxed">
              Unlike rushed salon conveyor-belts, we treat every appointment with focused attention. Every fade is seamlessly blended, every straight-razor shave is treated with hot towels and skin balms, and our workspace maintains uncompromising standards of hygiene.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bronze mt-1 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-ivory/80 font-medium">
                  Custom scissor and clipper consultations
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bronze mt-1 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-ivory/80 font-medium">
                  Straight-razor hot & cold towel service
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bronze mt-1 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-ivory/80 font-medium">
                  Guaranteed appointment time slots
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bronze mt-1 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-ivory/80 font-medium">
                  Herbal facials & scalp revitalization
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-bronze hover:text-bronze-light transition"
              >
                <span>Read our full story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FEATURED SERVICES & PRICING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-bronze font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Menu</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ivory">
              Signature Services
            </h2>
            <p className="text-sm text-ivory/60 mt-1 max-w-lg">
              Honest pricing, uncompromised craftsmanship. Stored and calculated live from our salon database.
            </p>
          </div>

          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-bronze hover:text-bronze-light transition"
          >
            <span>View All Services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-64 rounded-xl skeleton"></div>
            ))
          ) : (
            services.map((srv) => (
              <div
                key={srv.id}
                className="bg-charcoal-800 rounded-xl border border-white/5 hover:border-bronze/40 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group"
              >
                <div>
                  <div className="h-40 rounded-lg overflow-hidden mb-4 bg-charcoal-700">
                    <img
                      src={srv.imageUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'}
                      alt={srv.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-bronze font-semibold block mb-1">
                    {srv.categoryName || 'Hair Studio'}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-ivory mb-2 line-clamp-1">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-ivory/60 line-clamp-2 leading-relaxed mb-4">
                    {srv.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-bronze text-lg">
                      {formatPrice(srv.pricePaise)}
                    </span>
                    <span className="block text-[11px] text-ivory/50">
                      {formatDuration(srv.durationMinutes)}
                    </span>
                  </div>

                  <Link
                    to={`/book?service=${srv.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-bronze/10 text-bronze hover:bg-bronze hover:text-charcoal-900 font-semibold text-xs transition"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. VERIFIED GOOGLE MAPS REVIEWS & TESTIMONIALS */}
      <section className="bg-charcoal-800/50 border-y border-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold mb-3">
              <Star className="w-3.5 h-3.5 fill-emerald-400" />
              <span>5.0 Star Rating on Google Maps</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ivory">
              Client Feedback & Satisfaction
            </h2>
            <p className="text-sm text-ivory/60 mt-2">
              Real opinions from clients visiting our Mangrol grooming studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-charcoal-900 p-6 rounded-xl border border-white/5 relative">
              <div className="flex items-center gap-1 text-bronze mb-4">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-bronze" />
                ))}
              </div>
              <p className="text-sm text-ivory/80 italic leading-relaxed mb-6">
                "One of the best hair studios in Mangrol. Precise haircut, very polite staff, and clean tools. 
                I always visit Santosh Hair Art whenever I need a clean cut before family events."
              </p>
              <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-xs text-ivory">Google Maps Reviewer</span>
                  <span className="block text-[11px] text-ivory/50">Verified Local Guide</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                  5.0 ★
                </span>
              </div>
            </div>

            <div className="bg-charcoal-900 p-6 rounded-xl border border-white/5 relative">
              <div className="flex items-center gap-1 text-bronze mb-4">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-bronze" />
                ))}
              </div>
              <p className="text-sm text-ivory/80 italic leading-relaxed mb-6">
                "The hot towel shave and head massage are exceptionally relaxing. No long wait times when you book your slot. Highly recommended for men in Mangrol and Shil."
              </p>
              <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-xs text-ivory">Bhavik P.</span>
                  <span className="block text-[11px] text-ivory/50">Mangrol Resident</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                  5.0 ★
                </span>
              </div>
            </div>

            <div className="bg-charcoal-900 p-6 rounded-xl border border-white/5 relative">
              <div className="flex items-center gap-1 text-bronze mb-4">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-bronze" />
                ))}
              </div>
              <p className="text-sm text-ivory/80 italic leading-relaxed mb-6">
                "Excellent beard shaping. The barber understands face geometry and does sharp clean edges. Fair pricing and friendly hospitality."
              </p>
              <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-xs text-ivory">Irfan B.</span>
                  <span className="block text-[11px] text-ivory/50">Regular Customer</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                  5.0 ★
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LOCATION & GOOGLE MAPS CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-900 rounded-2xl border border-white/10 p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-bronze font-bold">
                <MapPin className="w-4 h-4" />
                <span>Visit Us in Mangrol</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ivory leading-tight">
                Conveniently Located Near SBI Bank, Shil
              </h2>

              <p className="text-sm sm:text-base text-ivory/70 leading-relaxed">
                Whether you live in Mangrol, Shil, or neighboring talukas of Junagadh, our salon is easy to reach right near SBI Bank in Shil.
              </p>

              <div className="space-y-3 pt-2 text-sm text-ivory/80">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-bronze" />
                  <span>Verified Contact: <a href={`tel:${verifiedPhone}`} className="text-bronze font-medium hover:underline">{verifiedPhone}</a></span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-bronze" />
                  <span>Open Daily: 9:00 AM – 9:00 PM (Afternoon break 1:30–2:30 PM)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition shadow-lg shadow-bronze/10"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Get Driving Directions</span>
                </a>

                <a
                  href={`https://wa.me/${cleanPhone}?text=Hello%20Santosh%20Hair%20Art,%20I%20would%20like%20to%20book%20an%20appointment.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-charcoal-700 text-ivory hover:text-emerald-400 font-semibold text-sm border border-white/10 hover:border-emerald-500/30 transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Inquiry</span>
                </a>
              </div>
            </div>

            {/* Visual map preview card */}
            <div className="rounded-xl overflow-hidden border border-white/10 bg-charcoal-900 p-6 flex flex-col justify-between h-full min-h-[280px]">
              <div>
                <span className="text-xs uppercase tracking-wider text-bronze font-bold block mb-2">
                  Interactive Map Coordinates
                </span>
                <p className="font-serif text-xl text-ivory font-bold mb-1">
                  Santosh Hair Art
                </p>
                <p className="text-xs text-ivory/60 mb-4">
                  Near SBI Bank, Shil, Mangrol, Gujarat, 362240
                </p>
                <div className="text-xs space-y-1 text-ivory/70 bg-charcoal-800 p-3 rounded-lg border border-white/5 font-mono">
                  <div>Latitude: 21.1889284° N</div>
                  <div>Longitude: 70.0476545° E</div>
                  <div>Timezone: Asia/Kolkata (IST)</div>
                </div>
              </div>

              <div className="pt-6">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-2.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-ivory text-xs font-semibold border border-white/10 transition"
                >
                  Open in Google Maps Application ↗
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
