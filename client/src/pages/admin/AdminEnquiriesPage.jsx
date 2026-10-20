import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import fetchApi from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadEnquiries = () => {
    setLoading(true);
    fetchApi('/admin/enquiries')
      .then((res) => {
        if (res.success && res.data) {
          setEnquiries(res.data);
        }
      })
      .catch((err) => toast.error('Failed to load enquiries.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetchApi(`/admin/enquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        toast.success(`Enquiry marked as ${status}`);
        loadEnquiries();
      }
    } catch (err) {
      toast.error('Update failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ivory">
          Customer Enquiries & Messages
        </h1>
        <p className="text-xs text-ivory/60 mt-1">
          Messages received from the public website contact form.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 rounded-xl skeleton"></div>
          ))}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-12 text-center text-ivory/50">
          <MessageSquare className="w-8 h-8 mx-auto text-ivory/30 mb-2" />
          <p className="text-sm">No messages received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((e) => (
            <div
              key={e.id}
              className="bg-charcoal-800 rounded-xl border border-white/5 p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-serif font-bold text-base text-ivory">{e.fullName}</span>
                  <span className="text-xs font-mono text-bronze">{e.phone}</span>
                  {e.email && <span className="text-xs text-ivory/50">{e.email}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-ivory/40">
                    {format(new Date(e.createdAt), 'MMM d, yyyy • hh:mm a')}
                  </span>
                  <select
                    value={e.status}
                    onChange={(ev) => handleUpdateStatus(e.id, ev.target.value)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-charcoal-900 border border-white/10 text-ivory"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-ivory/80 leading-relaxed bg-charcoal-900 p-3 rounded-lg border border-white/5">
                "{e.message}"
              </p>

              <div className="flex items-center gap-4 text-xs pt-1">
                <a
                  href={`tel:${e.phone}`}
                  className="text-bronze hover:underline flex items-center gap-1 font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Back</span>
                </a>
                <a
                  href={`https://wa.me/${e.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
