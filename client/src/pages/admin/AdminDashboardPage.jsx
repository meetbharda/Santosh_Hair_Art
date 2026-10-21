import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  IndianRupee,
  Scissors,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import fetchApi from '../../lib/api';
import { formatPrice, getStatusBadge } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadDashboard = () => {
    setLoading(true);
    fetchApi('/admin/dashboard')
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch((err) => {
        toast.error('Failed to load dashboard metrics.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 rounded-xl skeleton"></div>
          ))}
        </div>
        <div className="h-64 rounded-xl skeleton"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-charcoal-800 p-8 rounded-2xl border border-white/5 text-center space-y-4 max-w-lg mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-ivory">Unable to Load Dashboard</h2>
        <p className="text-xs text-ivory/60">
          Your session may have expired or dashboard metrics could not be retrieved.
        </p>
        <button
          onClick={loadDashboard}
          className="px-5 py-2.5 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const popularServices = data?.popularServices || [];
  const recentBookings = data?.recentBookings || [];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ivory">
          Operations Overview
        </h1>
        <p className="text-xs text-ivory/60 mt-1">
          Live snapshot of Santosh Hair Art daily schedule, bookings, and revenue metrics.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-charcoal-800 p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-ivory/60 text-xs">
            <span>Today’s Appointments</span>
            <Calendar className="w-4 h-4 text-bronze" />
          </div>
          <div className="font-serif text-3xl font-bold text-ivory">
            {metrics.todayCount || 0}
          </div>
          <span className="text-[11px] text-ivory/40 block">Scheduled for today</span>
        </div>

        <div className="bg-charcoal-800 p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-ivory/60 text-xs">
            <span>Upcoming Bookings</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-400">
            {metrics.upcomingCount || 0}
          </div>
          <span className="text-[11px] text-ivory/40 block">Future confirmed slots</span>
        </div>

        <div className="bg-charcoal-800 p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-ivory/60 text-xs">
            <span>Completed Appointments</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-ivory">
            {metrics.completedCount || 0}
          </div>
          <span className="text-[11px] text-ivory/40 block">Total services rendered</span>
        </div>

        <div className="bg-charcoal-800 p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-ivory/60 text-xs">
            <span>Earned Revenue</span>
            <IndianRupee className="w-4 h-4 text-bronze" />
          </div>
          <div className="font-serif text-3xl font-bold text-bronze">
            {formatPrice(metrics.totalRevenuePaise || 0)}
          </div>
          <span className="text-[11px] text-ivory/40 block">From completed visits</span>
        </div>

      </div>

      {/* Popular Services & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Popular Services (Col 1) */}
        <div className="bg-charcoal-800 p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-serif text-lg font-bold text-ivory flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-bronze" />
            <span>Popular Services</span>
          </h3>

          <div className="space-y-3">
            {popularServices.length === 0 ? (
              <p className="text-xs text-ivory/40">No service booking data yet.</p>
            ) : (
              popularServices.map((ps) => (
                <div key={ps.name} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-ivory/80 font-medium truncate max-w-[200px]">{ps.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-bronze/10 text-bronze font-bold text-[11px]">
                    {ps.count} {ps.count === 1 ? 'booking' : 'bookings'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Operational Status (Col 2) */}
        <div className="bg-charcoal-800 p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-serif text-lg font-bold text-ivory flex items-center gap-2">
            <Scissors className="w-4 h-4 text-bronze" />
            <span>Salon Catalog & Limits</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-ivory/60">Active Services:</span>
              <span className="font-bold text-ivory">{metrics.servicesCount} services</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-ivory/60">Pending Confirmations:</span>
              <span className="font-bold text-amber-400">{metrics.pendingCount || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-ivory/60">Cancelled Bookings:</span>
              <span className="font-bold text-rose-400">{metrics.cancelledCount || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ivory/60">Booking Window:</span>
              <span className="font-bold text-ivory">30 days advance</span>
            </div>
          </div>
        </div>

        {/* Quick Links / Actions (Col 3) */}
        <div className="bg-charcoal-800 p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-ivory mb-2">
              Management Shortcuts
            </h3>
            <p className="text-xs text-ivory/60 leading-relaxed mb-4">
              Quick access to appointment schedules, menu editing, and shop opening hours.
            </p>
          </div>

          <div className="space-y-2">
            <Link
              to="/admin/appointments"
              className="flex items-center justify-between p-2.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-700 text-xs font-semibold text-ivory transition border border-white/5"
            >
              <span>Manage Appointments</span>
              <ArrowRight className="w-3.5 h-3.5 text-bronze" />
            </Link>
            <Link
              to="/admin/schedule"
              className="flex items-center justify-between p-2.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-700 text-xs font-semibold text-ivory transition border border-white/5"
            >
              <span>Adjust Hours & Block Dates</span>
              <ArrowRight className="w-3.5 h-3.5 text-bronze" />
            </Link>
          </div>
        </div>

      </div>

      {/* Recent Bookings Table */}
      <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-ivory">
            Recent Appointments
          </h3>
          <Link
            to="/admin/appointments"
            className="text-xs font-semibold text-bronze hover:underline"
          >
            View All →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-xs text-ivory/40 py-8 text-center">No bookings recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-ivory/50 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Phone</th>
                  <th className="pb-3 font-semibold">Slot Date & Time</th>
                  <th className="pb-3 font-semibold">Services</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-charcoal-700/50 transition">
                    <td className="py-3 font-mono font-bold text-bronze">{b.bookingReference}</td>
                    <td className="py-3 font-semibold text-ivory">{b.customerName}</td>
                    <td className="py-3 text-ivory/70">{b.customerPhone}</td>
                    <td className="py-3 text-ivory/80">
                      {format(new Date(b.startTime), 'MMM d, yyyy • hh:mm a')}
                    </td>
                    <td className="py-3 text-ivory/60 max-w-[200px] truncate">
                      {b.bookingServices?.map((s) => s.serviceName).join(', ')}
                    </td>
                    <td className="py-3 font-bold text-ivory">{formatPrice(b.totalPricePaise)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
