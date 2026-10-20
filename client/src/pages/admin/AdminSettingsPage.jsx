import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck, MapPin, Phone, Clock } from 'lucide-react';
import fetchApi from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchApi('/admin/settings')
      .then((res) => {
        if (res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch((err) => toast.error('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, val) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        businessName: settings.businessName,
        tagline: settings.tagline,
        phoneNumber: settings.phoneNumber,
        whatsappNumber: settings.whatsappNumber,
        email: settings.email,
        address: settings.address,
        googleMapsUrl: settings.googleMapsUrl,
        timezone: settings.timezone,
        slotIntervalMinutes: parseInt(settings.slotIntervalMinutes, 10),
        leadTimeHours: parseInt(settings.leadTimeHours, 10),
        maxAdvanceDays: parseInt(settings.maxAdvanceDays, 10),
        cancellationCutoffHrs: parseInt(settings.cancellationCutoffHrs, 10),
        bufferTimeMinutes: parseInt(settings.bufferTimeMinutes, 10),
        isAutoConfirm: settings.isAutoConfirm
      };

      const res = await fetchApi('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        toast.success('Business settings updated successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Saving settings failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="h-64 rounded-xl skeleton"></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ivory">
            Studio & Scheduling Configuration
          </h1>
          <p className="text-xs text-ivory/60 mt-1">
            Control verified business identity, Google Maps coordinates, buffer times, and booking parameters.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition shadow-md self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* 1. Identity & Location */}
      <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-8 space-y-6">
        <h3 className="font-serif text-lg font-bold text-bronze border-b border-white/5 pb-2">
          Studio Identity & Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-ivory/80 font-medium mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={settings.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm"
            />
          </div>

          <div>
            <label className="block text-ivory/80 font-medium mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm"
            />
          </div>

          <div>
            <label className="block text-ivory/80 font-medium mb-1">Direct Phone (Verified) *</label>
            <input
              type="text"
              required
              value={settings.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-ivory/80 font-medium mb-1">WhatsApp Contact Number *</label>
            <input
              type="text"
              required
              value={settings.whatsappNumber}
              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-ivory/80 font-medium mb-1">Physical Address *</label>
            <input
              type="text"
              required
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-ivory/80 font-medium mb-1">Google Maps Direct URL</label>
            <input
              type="url"
              value={settings.googleMapsUrl}
              onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. Scheduling Engine Parameters */}
      <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-8 space-y-6">
        <h3 className="font-serif text-lg font-bold text-bronze border-b border-white/5 pb-2">
          Appointment Engine Rules & Buffers
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-ivory/80 font-medium mb-1">Slot Interval (Minutes)</label>
            <input
              type="number"
              min={15}
              max={60}
              step={15}
              value={settings.slotIntervalMinutes}
              onChange={(e) => handleChange('slotIntervalMinutes', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm"
            />
            <span className="text-[10px] text-ivory/40">Step between bookable times (e.g. 30 mins)</span>
          </div>

          <div>
            <label className="block text-ivory/80 font-medium mb-1">Buffer Time (Minutes)</label>
            <input
              type="number"
              min={0}
              max={30}
              step={5}
              value={settings.bufferTimeMinutes}
              onChange={(e) => handleChange('bufferTimeMinutes', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm"
            />
            <span className="text-[10px] text-ivory/40">Sanitization gap added after each visit</span>
          </div>

          <div>
            <label className="block text-ivory/80 font-medium mb-1">Booking Lead Time (Hours)</label>
            <input
              type="number"
              min={0}
              max={24}
              value={settings.leadTimeHours}
              onChange={(e) => handleChange('leadTimeHours', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm"
            />
            <span className="text-[10px] text-ivory/40">Minimum advance notice required</span>
          </div>

          <div>
            <label className="block text-ivory/80 font-medium mb-1">Max Advance Booking (Days)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={settings.maxAdvanceDays}
              onChange={(e) => handleChange('maxAdvanceDays', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm"
            />
            <span className="text-[10px] text-ivory/40">How far in advance clients can book</span>
          </div>

          <div>
            <label className="block text-ivory/80 font-medium mb-1">Cancellation Cutoff (Hours)</label>
            <input
              type="number"
              min={0}
              max={24}
              value={settings.cancellationCutoffHrs}
              onChange={(e) => handleChange('cancellationCutoffHrs', e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm"
            />
            <span className="text-[10px] text-ivory/40">Hours before visit when client can cancel</span>
          </div>

          <div>
            <label className="block text-ivory/80 font-medium mb-1">Timezone</label>
            <input
              type="text"
              readOnly
              value={settings.timezone}
              className="w-full px-3 py-2 bg-charcoal-900/60 border border-white/5 rounded-lg text-ivory/50 text-sm font-mono cursor-not-allowed"
            />
            <span className="text-[10px] text-ivory/40">Default Asia/Kolkata (IST)</span>
          </div>
        </div>

        {/* Auto Confirm Toggle */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <span className="block text-sm font-bold text-ivory">Auto-Confirm Bookings</span>
            <span className="block text-xs text-ivory/50">
              When enabled, incoming public bookings are immediately marked CONFIRMED instead of PENDING.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.isAutoConfirm}
              onChange={(e) => handleChange('isAutoConfirm', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-charcoal-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bronze"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition shadow-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

    </form>
  );
}
