import React, { useState, useEffect } from 'react';
import { Scissors, Plus, Edit, Power, Clock, IndianRupee, Sparkles, X } from 'lucide-react';
import fetchApi from '../../lib/api';
import { formatPrice, formatDuration } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

export default function AdminServicesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(5);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadServices = () => {
    setLoading(true);
    fetchApi('/admin/services')
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data);
          if (res.data.length > 0 && !categoryId) {
            setCategoryId(res.data[0].id);
          }
        }
      })
      .catch((err) => {
        toast.error('Failed to load services.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPriceRupees('150');
    setDurationMinutes(30);
    setBufferMinutes(5);
    setImageUrl('');
    if (categories.length > 0) setCategoryId(categories[0].id);
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setName(service.name);
    setCategoryId(service.categoryId);
    setDescription(service.description || '');
    setPriceRupees(String(service.pricePaise / 100));
    setDurationMinutes(service.durationMinutes);
    setBufferMinutes(service.bufferMinutes || 5);
    setImageUrl(service.imageUrl || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price in Rupees.');
      return;
    }

    const payload = {
      name: name.trim(),
      categoryId,
      description: description.trim() || undefined,
      pricePaise: Math.round(priceNum * 100),
      durationMinutes: parseInt(durationMinutes, 10),
      bufferMinutes: parseInt(bufferMinutes, 10),
      imageUrl: imageUrl.trim() || undefined
    };

    setSubmitting(true);
    try {
      if (editingService) {
        const res = await fetchApi(`/admin/services/${editingService.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          toast.success('Service updated successfully.');
          setModalOpen(false);
          loadServices();
        }
      } else {
        const res = await fetchApi('/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          toast.success('New service created.');
          setModalOpen(false);
          loadServices();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Saving service failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await fetchApi(`/admin/services/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        toast.info(res.message);
        loadServices();
      }
    } catch (err) {
      toast.error('Failed to change service status.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ivory">
            Services & Pricing Catalog
          </h1>
          <p className="text-xs text-ivory/60 mt-1">
            Configure haircuts, grooming packages, durations, and pricing in INR.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services List by Category */}
      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 rounded-xl skeleton"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="font-serif text-xl font-bold text-bronze">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-ivory/50 mt-0.5">{cat.description}</p>
                  )}
                </div>
                <span className="text-xs text-ivory/40">
                  {cat.services.length} {cat.services.length === 1 ? 'service' : 'services'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.services.map((srv) => (
                  <div
                    key={srv.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                      srv.isActive
                        ? 'bg-charcoal-900 border-white/5 hover:border-bronze/30'
                        : 'bg-charcoal-900/40 border-white/5 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="font-serif text-base font-bold text-ivory">
                          {srv.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            srv.isActive
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                              : 'bg-charcoal-800 text-ivory/40'
                          }`}
                        >
                          {srv.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-ivory/60 line-clamp-2 mb-3">
                        {srv.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-bronze text-sm mr-3">
                          {formatPrice(srv.pricePaise)}
                        </span>
                        <span className="text-ivory/50">
                          {formatDuration(srv.durationMinutes)} (+{srv.bufferMinutes}m buffer)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(srv)}
                          className="p-1.5 text-ivory/60 hover:text-ivory bg-charcoal-800 hover:bg-charcoal-700 rounded transition"
                          title="Edit Service"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(srv.id)}
                          className={`p-1.5 rounded transition ${
                            srv.isActive
                              ? 'text-rose-400 hover:bg-rose-950/40'
                              : 'text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                          title={srv.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-800 rounded-2xl border border-white/10 p-6 sm:p-8 max-w-lg w-full space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold text-ivory">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-ivory/50 hover:text-ivory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-ivory/80 font-medium mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Traditional Beard Trim"
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm focus:outline-none focus:border-bronze"
                />
              </div>

              <div>
                <label className="block text-ivory/80 font-medium mb-1">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm focus:outline-none focus:border-bronze"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-ivory/80 font-medium mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm focus:outline-none focus:border-bronze"
                  />
                </div>
                <div>
                  <label className="block text-ivory/80 font-medium mb-1">Duration (mins) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm focus:outline-none focus:border-bronze"
                  />
                </div>
                <div>
                  <label className="block text-ivory/80 font-medium mb-1">Buffer (mins)</label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(e.target.value)}
                    className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm focus:outline-none focus:border-bronze"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ivory/80 font-medium mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm focus:outline-none focus:border-bronze"
                />
              </div>

              <div>
                <label className="block text-ivory/80 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of the treatment, products used, or steps..."
                  className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-ivory text-sm focus:outline-none focus:border-bronze"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-ivory/60 hover:text-ivory"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition disabled:opacity-40"
                >
                  {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
