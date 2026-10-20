import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, MapPin, Phone, MessageSquare, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const verifiedPhone = '+91 95378 51649';
  const cleanPhone = '919537851649';
  const mapsUrl = 'https://maps.app.goo.gl/1NHaQgexgWuvfmq16';

  return (
    <footer className="bg-charcoal-900 border-t border-white/5 pt-16 pb-12 text-ivory/70 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-bronze/10 border border-bronze/30 flex items-center justify-center text-bronze">
                <Scissors className="w-4 h-4 -rotate-45" />
              </div>
              <span className="font-serif text-xl tracking-tight text-ivory font-bold">
                Santosh Hair Art
              </span>
            </div>
            <p className="text-xs leading-relaxed text-ivory/60">
              Artisanal men’s barbering and grooming studio situated near ST Bus Station, Mangrol, Gujarat. 
              Dedicated to precision scissor craft, straight-razor shaving, and revitalizing personal care.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Accepting Online Appointments
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-serif text-base text-ivory font-semibold mb-4 text-bronze">
              Explore Studio
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/services" className="hover:text-bronze transition">Services & Pricing</Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-bronze transition">Book an Appointment</Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-bronze transition">Haircut & Grooming Gallery</Link>
              </li>
              <li>
                <Link to="/lookup" className="hover:text-bronze transition">Check Appointment Status</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-bronze transition">About Our Master Barbers</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-bronze transition">Contact & Location</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Operating Hours */}
          <div>
            <h4 className="font-serif text-base text-ivory font-semibold mb-4 text-bronze flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Studio Hours
            </h4>
            <ul className="space-y-2 text-xs text-ivory/70">
              <li className="flex justify-between py-1 border-b border-white/5">
                <span>Monday – Saturday</span>
                <span className="text-ivory font-medium">9:00 AM – 9:00 PM</span>
              </li>
              <li className="flex justify-between py-1 border-b border-white/5">
                <span>Sunday</span>
                <span className="text-ivory font-medium">9:00 AM – 9:00 PM</span>
              </li>
              <li className="flex justify-between py-1 text-ivory/50">
                <span>Afternoon Pause</span>
                <span>1:30 PM – 2:30 PM</span>
              </li>
            </ul>
            <p className="text-[11px] text-ivory/40 mt-3">
              Advance booking recommended for weekend peak hours.
            </p>
          </div>

          {/* Col 4: Verified Contact & Directions */}
          <div>
            <h4 className="font-serif text-base text-ivory font-semibold mb-4 text-bronze">
              Visit Studio
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Near ST Bus Station, Chock, Gaffar Belim, Mangrol, Gujarat 362225, India
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-bronze flex-shrink-0" />
                <a href={`tel:${verifiedPhone}`} className="hover:text-ivory transition">
                  {verifiedPhone}
                </a>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`https://wa.me/${cleanPhone}?text=Hello%20Santosh%20Hair%20Art,%20I%20would%20like%20to%20inquire%20about%20an%20appointment.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition text-xs font-semibold"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat on WhatsApp
                </a>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-charcoal-800 text-ivory hover:text-bronze border border-white/10 hover:border-bronze/30 transition text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Get Google Maps Directions
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-ivory/40 gap-4">
          <p>© {new Date().getFullYear()} Santosh Hair Art. All rights reserved. Mangrol, Gujarat.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-ivory transition">Privacy & Policies</Link>
            <Link to="/auth" className="hover:text-ivory transition flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-bronze" />
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
