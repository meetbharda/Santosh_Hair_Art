import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { MessageCircle } from 'lucide-react';

export default function PublicLayout() {
  const cleanPhone = '919537851649';

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-900 text-ivory">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Floating WhatsApp Action Pill */}
      <a
        href={`https://wa.me/${cleanPhone}?text=Hello%20Santosh%20Hair%20Art,%20I%20have%20a%20question%20regarding%20booking.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct WhatsApp Chat"
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-full shadow-2xl shadow-emerald-950/80 transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-semibold"
      >
        <MessageCircle className="w-5 h-5 fill-white" />
        <span className="hidden sm:inline">WhatsApp Us</span>
      </a>
    </div>
  );
}
