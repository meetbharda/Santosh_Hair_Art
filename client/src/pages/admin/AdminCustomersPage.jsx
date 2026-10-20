import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import fetchApi from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchApi('/admin/customers')
      .then((res) => {
        if (res.success && res.data) {
          setCustomers(res.data);
        }
      })
      .catch((err) => toast.error('Failed to load customers.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const name = c.profile?.fullName || '';
    const phone = c.profile?.phoneNumber || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || phone.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ivory">
            Customer Directory
          </h1>
          <p className="text-xs text-ivory/60 mt-1">
            Registered accounts, appointment history, and client profiles.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-ivory/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-9 pr-3 py-2 bg-charcoal-800 border border-white/10 rounded-lg text-xs text-ivory focus:outline-none focus:border-bronze"
          />
        </div>
      </div>

      <div className="bg-charcoal-800 rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-14 rounded-lg skeleton"></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-xs text-ivory/40">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-900/60 border-b border-white/10 text-ivory/50 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold">Total Bookings</th>
                  <th className="py-3 px-4 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-charcoal-700/40 transition">
                    <td className="py-3 px-4 font-bold text-ivory">
                      {c.profile?.fullName || 'Guest Customer'}
                      {c.profile?.notes && (
                        <span className="block text-[10px] text-ivory/40 font-normal italic mt-0.5">
                          Pref: {c.profile.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-ivory/70">{c.email}</td>
                    <td className="py-3 px-4 text-bronze font-mono">
                      {c.profile?.phoneNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-ivory font-semibold">
                      {c.bookings?.length || 0} visits
                    </td>
                    <td className="py-3 px-4 text-ivory/50">
                      {format(new Date(c.createdAt), 'MMM d, yyyy')}
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
