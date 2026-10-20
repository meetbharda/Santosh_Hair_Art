import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Clock,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center text-ivory">
        <div className="w-8 h-8 border-2 border-bronze border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Strict role guard
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-charcoal-900 flex flex-col items-center justify-center p-6 text-center text-ivory">
        <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold mb-2">Restricted Admin Access</h2>
        <p className="text-sm text-ivory/60 max-w-md mb-6">
          You must be logged in with an authorized administrator account to manage Santosh Hair Art salon operations.
        </p>
        <Link
          to="/auth"
          className="px-6 py-2.5 rounded-lg bg-bronze text-charcoal-900 font-semibold text-sm hover:bg-bronze-light transition"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
    { name: 'Services Menu', path: '/admin/services', icon: Scissors },
    { name: 'Hours & Blocks', path: '/admin/schedule', icon: Clock },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex bg-charcoal-900 text-ivory font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-charcoal-800 border-r border-white/5 flex flex-col transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bronze/10 border border-bronze/30 flex items-center justify-center text-bronze">
              <Scissors className="w-4 h-4 -rotate-45" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-ivory block leading-tight">Santosh</span>
              <span className="text-[10px] uppercase tracking-widest text-bronze font-semibold">Studio Admin</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-ivory/50 hover:text-ivory lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-bronze text-charcoal-900 font-semibold shadow-md'
                      : 'text-ivory/70 hover:bg-charcoal-700 hover:text-ivory'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-ivory/60 hover:text-bronze hover:bg-charcoal-700 transition"
          >
            <span>View Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-charcoal-800/60 backdrop-blur border-b border-white/5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-ivory/70 hover:text-ivory rounded-lg hover:bg-charcoal-700 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-medium text-ivory/80 hidden sm:block">
              Santosh Hair Art Operations Portal
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-semibold text-ivory">
                {user.profile?.fullName || 'Salon Manager'}
              </span>
              <span className="block text-[11px] text-bronze">{user.email}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-bronze/20 border border-bronze/40 flex items-center justify-center font-serif text-bronze font-bold text-sm">
              S
            </div>
          </div>
        </header>

        {/* Outlet */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
