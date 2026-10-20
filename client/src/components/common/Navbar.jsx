import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Scissors, Menu, X, Calendar, User, LogOut, ShieldCheck, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-charcoal-900/95 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-bronze/10 border border-bronze/30 flex items-center justify-center text-bronze group-hover:scale-105 transition">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <span className="font-serif text-xl tracking-tight text-ivory block leading-none font-bold">
                Santosh
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-bronze font-semibold block mt-1">
                Hair Art • Mangrol
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-bronze ${
                    isActive ? 'text-bronze font-semibold' : 'text-ivory/80'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            <Link
              to="/lookup"
              className="text-xs uppercase tracking-wider text-ivory/60 hover:text-ivory flex items-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5 text-bronze" />
              <span>Lookup</span>
            </Link>
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-bronze/20 text-bronze border border-bronze/40 hover:bg-bronze hover:text-charcoal-900 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
                
                <Link
                  to="/portal"
                  className="inline-flex items-center gap-2 text-sm text-ivory/90 hover:text-ivory bg-charcoal-800 px-3 py-1.5 rounded-lg border border-white/10 hover:border-bronze/40 transition"
                >
                  <User className="w-4 h-4 text-bronze" />
                  <span>{user.profile?.fullName?.split(' ')[0] || 'My Account'}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 text-ivory/50 hover:text-rose-400 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-sm font-medium text-ivory/80 hover:text-ivory transition"
              >
                Sign In
              </Link>
            )}

            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-bronze text-charcoal-900 font-semibold text-sm hover:bg-bronze-light transition shadow-lg shadow-bronze/10 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              to="/book"
              className="px-3 py-1.5 rounded-md bg-bronze text-charcoal-900 font-semibold text-xs"
            >
              Book
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-ivory/80 hover:text-ivory hover:bg-charcoal-800 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-charcoal-800 border-b border-white/10 px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-medium text-ivory hover:bg-charcoal-700 hover:text-bronze transition"
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/lookup"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-ivory/70 hover:bg-charcoal-700 hover:text-bronze flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4 text-bronze" />
              <span>Find Appointment by Code</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-3 py-1 text-xs text-ivory/50">
                  Signed in as <span className="text-bronze">{user.email}</span>
                </div>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-bronze/10 text-bronze"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ivory hover:bg-charcoal-700"
                >
                  <User className="w-4 h-4 text-bronze" />
                  My Appointments & Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-charcoal-700 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-lg border border-white/10 text-sm font-medium text-ivory"
              >
                Sign In / Register
              </Link>
            )}

            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center py-3 rounded-lg bg-bronze text-charcoal-900 font-bold text-sm shadow-md"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
