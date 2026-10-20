import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import fetchApi from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export default function AdminSchedulePage() {
  const [hours, setHours] = useState([]);
  const [blockedPeriods, setBlockedPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);

  // New Block form
  const [blockTitle, setBlockTitle] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [addingBlock, setAddingBlock] = useState(false);

  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [hoursRes, blocksRes] = await Promise.all([
        fetchApi('/admin/business-hours'),
        fetchApi('/admin/blocked-periods')
      ]);

      if (hoursRes.success) {
        setHours(hoursRes.data || []);
      }
      if (blocksRes.success) {
        setBlockedPeriods(blocksRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load schedule data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHourChange = (index, field, value) => {
    const updated = [...hours];
    updated[index][field] = value;
    setHours(updated);
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      const res = await fetchApi('/admin/business-hours', {
        method: 'PUT',
        body: JSON.stringify({ hours })
      });
      if (res.success) {
        toast.success('Weekly business hours saved.');
      }
    } catch (err) {
      toast.error(err.message || 'Saving hours failed.');
    } finally {
      setSavingHours(false);
    }
  };

  const handleAddBlockedPeriod = async (e) => {
    e.preventDefault();
    if (!blockStart || !blockEnd) {
      toast.error('Start and end date/time are required.');
      return;
    }

    setAddingBlock(true);
    try {
      const res = await fetchApi('/admin/blocked-periods', {
        method: 'POST',
        body: JSON.stringify({
          title: blockTitle.trim(),
          reason: blockReason.trim() || undefined,
          startDateTime: new Date(blockStart).toISOString(),
          endDateTime: new Date(blockEnd).toISOString(),
          isAllDay
        })
      });
      if (res.success) {
        toast.success('Blocked period created. Calendar updated.');
        setBlockTitle('');
        setBlockReason('');
        setBlockStart('');
        setBlockEnd('');
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Could not add blocked period.');
    } finally {
      setAddingBlock(false);
    }
  };

  const handleDeleteBlockedPeriod = async (id) => {
    try {
      const res = await fetchApi(`/admin/blocked-periods/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        toast.info('Blocked period removed.');
        loadData();
      }
    } catch (err) {
      toast.error('Could not remove block.');
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ivory">
          Studio Schedule & Blocked Dates
        </h1>
        <p className="text-xs text-ivory/60 mt-1">
          Configure weekly opening hours and declare exceptional holidays or maintenance closures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Weekly Hours Table (Col 7) */}
        <div className="lg:col-span-7 bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-ivory flex items-center gap-2">
                <Clock className="w-4 h-4 text-bronze" />
                <span>Weekly Business Hours</span>
              </h3>
              <p className="text-xs text-ivory/50 mt-0.5">
                Appointments are generated only within these open intervals.
              </p>
            </div>

            <button
              onClick={handleSaveHours}
              disabled={savingHours}
              className="px-4 py-2 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition disabled:opacity-50"
            >
              {savingHours ? 'Saving...' : 'Save Weekly Hours'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="h-12 rounded-lg skeleton"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {hours.map((h, idx) => (
                <div
                  key={h.id || h.dayOfWeek}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-charcoal-900 border border-white/5 gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 w-32">
                    <span className="font-semibold text-ivory">
                      {DAYS_OF_WEEK[h.dayOfWeek]}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={h.isClosed}
                        onChange={(e) => handleHourChange(idx, 'isClosed', e.target.checked)}
                        className="rounded bg-charcoal-800 text-bronze focus:ring-0"
                      />
                      <span className={h.isClosed ? 'text-rose-400 font-bold' : 'text-ivory/50'}>
                        Closed
                      </span>
                    </label>

                    {!h.isClosed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.openTime}
                          onChange={(e) => handleHourChange(idx, 'openTime', e.target.value)}
                          className="px-2 py-1 bg-charcoal-800 border border-white/10 rounded text-xs text-ivory"
                        />
                        <span className="text-ivory/40">to</span>
                        <input
                          type="time"
                          value={h.closeTime}
                          onChange={(e) => handleHourChange(idx, 'closeTime', e.target.value)}
                          className="px-2 py-1 bg-charcoal-800 border border-white/10 rounded text-xs text-ivory"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blocked Dates & Holidays (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Add Block Form */}
          <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-ivory flex items-center gap-2">
              <Plus className="w-4 h-4 text-bronze" />
              <span>Block Date or Holiday</span>
            </h3>

            <form onSubmit={handleAddBlockedPeriod} className="space-y-3 text-xs">
              <div>
                <label className="block text-ivory/70 mb-1">Title / Holiday Name *</label>
                <input
                  type="text"
                  required
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  placeholder="e.g. Diwali Holiday, Studio Painting..."
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-ivory/70 mb-1">Start DateTime *</label>
                  <input
                    type="datetime-local"
                    required
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full px-2 py-1.5 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-xs"
                  />
                </div>
                <div>
                  <label className="block text-ivory/70 mb-1">End DateTime *</label>
                  <input
                    type="datetime-local"
                    required
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full px-2 py-1.5 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ivory/70 mb-1">Reason / Note (Optional)</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Master barber family event"
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={addingBlock}
                className="w-full py-2.5 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition disabled:opacity-50"
              >
                {addingBlock ? 'Saving Block...' : 'Block Selected Period'}
              </button>
            </form>
          </div>

          {/* Active Blocks List */}
          <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-ivory flex items-center justify-between">
              <span>Active Blocked Periods</span>
              <span className="text-xs text-ivory/40 font-normal">
                {blockedPeriods.length} {blockedPeriods.length === 1 ? 'block' : 'blocks'}
              </span>
            </h3>

            {blockedPeriods.length === 0 ? (
              <p className="text-xs text-ivory/40 py-4 text-center">
                No holidays or dates currently blocked.
              </p>
            ) : (
              <div className="space-y-2">
                {blockedPeriods.map((bp) => (
                  <div
                    key={bp.id}
                    className="p-3 bg-charcoal-900 rounded-xl border border-white/5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="block font-bold text-ivory">{bp.title}</span>
                      <span className="block text-[11px] text-ivory/60 mt-0.5">
                        {format(new Date(bp.startDateTime), 'MMM d, yyyy')} – {format(new Date(bp.endDateTime), 'MMM d, yyyy')}
                      </span>
                      {bp.reason && (
                        <span className="block text-[10px] text-amber-300/70 italic mt-0.5">
                          {bp.reason}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteBlockedPeriod(bp.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 transition"
                      title="Delete Block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
