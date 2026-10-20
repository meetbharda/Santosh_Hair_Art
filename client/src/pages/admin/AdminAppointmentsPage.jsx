import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Edit3,
  Phone,
  Mail,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import fetchApi from '../../lib/api';
import { formatPrice, getStatusBadge } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

export default function AdminAppointmentsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Note edit state
  const [activeBookingForNote, setActiveBookingForNote] = useState(null);
  const [noteText, setNoteText] = useState('');

  const toast = useToast();

  const loadBookings = () => {
    setLoading(true);
    let query = `/admin/bookings?`;
    if (search) query += `search=${encodeURIComponent(search)}&`;
    if (statusFilter) query += `status=${statusFilter}&`;
    if (dateFilter) query += `date=${dateFilter}&`;

    fetchApi(query)
      .then((res) => {
        if (res.success && res.data) {
          setBookings(res.data.bookings || []);
        }
      })
      .catch((err) => {
        toast.error('Failed to load appointments.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter, dateFilter]);

  const handleUpdateStatus = async (id, newStatus, reason = null) => {
    try {
      const res = await fetchApi(`/admin/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          cancellationReason: reason || undefined
        })
      });
      if (res.success) {
        toast.success(`Booking status changed to ${newStatus}`);
        loadBookings();
      }
    } catch (err) {
      toast.error(err.message || 'Status update failed.');
    }
  };

  const handleSaveNote = async () => {
    if (!activeBookingForNote) return;
    try {
      const res = await fetchApi(`/admin/bookings/${activeBookingForNote.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: activeBookingForNote.status,
          internalNotes: noteText
        })
      });
      if (res.success) {
        toast.success('Internal note saved.');
        setActiveBookingForNote(null);
        loadBookings();
      }
    } catch (err) {
      toast.error('Could not save internal note.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ivory">
            Appointment Management
          </h1>
          <p className="text-xs text-ivory/60 mt-1">
            Search, filter, confirm, complete, and update client appointments.
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 text-ivory/70 hover:text-ivory text-xs border border-white/5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-charcoal-800 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadBookings();
          }}
          className="relative w-full md:w-72"
        >
          <Search className="w-4 h-4 text-ivory/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, name, phone..."
            className="w-full pl-9 pr-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-bronze"
          />
        </form>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs text-ivory focus:outline-none focus:border-bronze"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[11px] text-ivory/50 hover:text-ivory"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-bronze text-charcoal-900 shadow-sm'
                  : 'bg-charcoal-900 text-ivory/70 hover:text-ivory'
              }`}
            >
              {st === '' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / List */}
      <div className="bg-charcoal-800 rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton"></div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-ivory/50 space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-ivory/30" />
            <p className="font-semibold text-sm text-ivory">No appointments match the criteria</p>
            <p className="text-xs">Try clearing filters or search queries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-900/60 border-b border-white/10 text-ivory/50 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Reference</th>
                  <th className="py-3.5 px-4 font-semibold">Guest Name & Phone</th>
                  <th className="py-3.5 px-4 font-semibold">Appointment Time</th>
                  <th className="py-3.5 px-4 font-semibold">Services Booked</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-charcoal-700/40 transition">
                    
                    {/* Ref */}
                    <td className="py-4 px-4 font-mono font-bold text-bronze">
                      {b.bookingReference}
                      {b.internalNotes && (
                        <span className="block text-[10px] text-ivory/40 font-sans italic mt-0.5">
                          Note: {b.internalNotes}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4 space-y-0.5">
                      <span className="block font-bold text-ivory text-sm">{b.customerName}</span>
                      <a href={`tel:${b.customerPhone}`} className="text-ivory/60 hover:text-bronze flex items-center gap-1">
                        <Phone className="w-3 h-3 text-bronze" />
                        <span>{b.customerPhone}</span>
                      </a>
                    </td>

                    {/* Time */}
                    <td className="py-4 px-4 space-y-0.5">
                      <span className="block font-medium text-ivory">
                        {format(new Date(b.startTime), 'EEE, MMM d, yyyy')}
                      </span>
                      <span className="block text-bronze">
                        {format(new Date(b.startTime), 'hh:mm a')} – {format(new Date(b.endTime), 'hh:mm a')}
                      </span>
                    </td>

                    {/* Services */}
                    <td className="py-4 px-4 text-ivory/80 max-w-[220px]">
                      {b.bookingServices?.map((s) => s.serviceName).join(', ')}
                      {b.notes && (
                        <span className="block text-[11px] text-amber-300/80 italic mt-1">
                          "{b.notes}"
                        </span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 font-bold text-ivory">
                      {formatPrice(b.totalPricePaise)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-4 text-right space-x-1 whitespace-nowrap">
                      {b.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                          title="Confirm Appointment"
                          className="px-2 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 rounded hover:bg-emerald-900/80 transition text-[11px] font-semibold"
                        >
                          Confirm
                        </button>
                      )}

                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                          title="Mark Visit Completed"
                          className="px-2 py-1 bg-blue-950/80 text-blue-400 border border-blue-800/40 rounded hover:bg-blue-900/80 transition text-[11px] font-semibold"
                        >
                          Complete
                        </button>
                      )}

                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for cancellation (optional):');
                              if (reason !== null) {
                                handleUpdateStatus(b.id, 'CANCELLED', reason);
                              }
                            }}
                            title="Cancel Appointment"
                            className="px-2 py-1 bg-rose-950/60 text-rose-400 border border-rose-800/40 rounded hover:bg-rose-900/60 transition text-[11px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'NO_SHOW')}
                            title="Mark as No-Show"
                            className="px-2 py-1 bg-charcoal-700 text-ivory/60 hover:text-ivory rounded transition text-[11px]"
                          >
                            No-Show
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setActiveBookingForNote(b);
                          setNoteText(b.internalNotes || '');
                        }}
                        title="Add Internal Note"
                        className="p-1 text-ivory/40 hover:text-bronze transition inline-block align-middle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Internal Note Modal */}
      {activeBookingForNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-800 rounded-2xl border border-white/10 p-6 max-w-sm w-full space-y-4">
            <h3 className="font-serif text-lg font-bold text-ivory">
              Internal Staff Note
            </h3>
            <p className="text-xs text-ivory/60">
              Ref: <span className="font-mono text-bronze">{activeBookingForNote.bookingReference}</span> • {activeBookingForNote.customerName}
            </p>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. VIP client, preferred stylist, arrived on time..."
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs text-ivory focus:outline-none focus:border-bronze"
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveBookingForNote(null)}
                className="px-3 py-1.5 text-xs text-ivory/60 hover:text-ivory"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
