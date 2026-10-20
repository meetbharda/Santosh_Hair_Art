import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Search, Clock, Sparkles, ArrowRight } from 'lucide-react';
import fetchApi from '../lib/api';
import { formatPrice, formatDuration } from '../lib/utils';

export default function ServicesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchApi('/public/services')
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter logic
  const allServices = categories.flatMap((cat) =>
    cat.services.map((s) => ({ ...s, categoryName: cat.name, categoryId: cat.id }))
  );

  const filteredServices = allServices.filter((s) => {
    const matchesCategory = selectedCategory === 'ALL' || s.categoryId === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-bronze/10 border border-bronze/30 text-bronze text-xs font-semibold uppercase tracking-widest">
          <Scissors className="w-3.5 h-3.5 -rotate-45" />
          <span>Complete Grooming Catalog</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ivory">
          Services & Craftsmanship Menu
        </h1>
        <p className="text-sm sm:text-base text-ivory/60 leading-relaxed">
          Every service is performed using sanitized, high-precision tools and tailored specifically to your hair type and style preferences.
        </p>
      </div>

      {/* Controls: Search & Category Pills */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-charcoal-800 p-4 rounded-xl border border-white/5">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ivory/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cuts, shaves, facials..."
            className="w-full pl-10 pr-4 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-bronze"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-bronze text-charcoal-900 shadow-sm'
                : 'bg-charcoal-900 text-ivory/70 hover:text-ivory hover:bg-charcoal-700'
            }`}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-bronze text-charcoal-900 shadow-sm'
                : 'bg-charcoal-900 text-ivory/70 hover:text-ivory hover:bg-charcoal-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 rounded-xl skeleton"></div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-charcoal-800/40 rounded-xl border border-white/5 space-y-3">
          <p className="text-base font-serif text-ivory">No services found</p>
          <p className="text-xs text-ivory/50">Try searching for something else or reset your filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
            className="text-xs text-bronze hover:underline font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="bg-charcoal-800 rounded-xl border border-white/5 hover:border-bronze/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group"
            >
              <div>
                <div className="h-44 rounded-lg overflow-hidden mb-4 bg-charcoal-700">
                  <img
                    src={srv.imageUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500&q=80'}
                    alt={srv.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-bronze font-bold">
                    {srv.categoryName}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-ivory/50">
                    <Clock className="w-3 h-3 text-bronze" />
                    <span>{formatDuration(srv.durationMinutes)}</span>
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold text-ivory mb-2">
                  {srv.name}
                </h3>
                <p className="text-xs text-ivory/70 leading-relaxed line-clamp-3 mb-6">
                  {srv.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="block text-xs text-ivory/50">Price</span>
                  <span className="block font-bold text-xl text-bronze">
                    {formatPrice(srv.pricePaise)}
                  </span>
                </div>

                <Link
                  to={`/book?service=${srv.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bronze text-charcoal-900 font-semibold text-xs hover:bg-bronze-light transition shadow-md"
                >
                  <span>Book Slot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom request callout */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-charcoal-800 to-charcoal-900 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="font-serif text-xl font-bold text-ivory">Looking for a tailored wedding or groom package?</h4>
          <p className="text-xs text-ivory/60 mt-1">We cater to complete wedding parties and special groom rituals upon request.</p>
        </div>
        <Link
          to="/contact"
          className="px-6 py-2.5 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-ivory text-xs font-semibold border border-white/10 transition whitespace-nowrap"
        >
          Inquire Directly
        </Link>
      </div>

    </div>
  );
}
