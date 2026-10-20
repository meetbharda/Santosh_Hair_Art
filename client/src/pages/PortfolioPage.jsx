import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, X, Eye } from 'lucide-react';

const galleryItems = [
  {
    id: 1,
    title: 'Low Skin Fade with Textured Top',
    category: 'Haircuts',
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
    description: 'Crisp blurry taper fade paired with scissor texture and natural matte finish.'
  },
  {
    id: 2,
    title: 'Classic Side-Part Pompadour',
    category: 'Haircuts',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    description: 'Timeless gentleman’s silhouette crafted with shears and traditional blow-dry.'
  },
  {
    id: 3,
    title: 'Precision Beard Line-up & Fade',
    category: 'Beard',
    imageUrl: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=800&q=80',
    description: 'Straight razor cheek and neck geometry with conditioned beard butter.'
  },
  {
    id: 4,
    title: 'Royal Hot Towel Shave Ritual',
    category: 'Beard',
    imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
    description: 'Steam preparation, soothing badger brush lather, and soothing aftershave.'
  },
  {
    id: 5,
    title: 'Herbal Facial & Skin Exfoliation',
    category: 'Skin Care',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    description: 'Rejuvenating de-tan mud pack removing sun damage and restoring natural glow.'
  },
  {
    id: 6,
    title: 'Complete VIP Groom Transformation',
    category: 'Packages',
    imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
    description: 'Full hair, beard, scalp spa, and facial grooming for Saurashtra wedding events.'
  }
];

export default function PortfolioPage() {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activeModalItem, setActiveModalItem] = useState(null);

  const filtered = selectedFilter === 'ALL'
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-bronze/10 border border-bronze/30 text-bronze text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Craftsmanship in Pictures</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ivory">
          Grooming & Haircut Portfolio
        </h1>
        <p className="text-sm sm:text-base text-ivory/60 leading-relaxed">
          Explore examples of signature cuts, sharp beard outlines, and luxury grooming services offered at Santosh Hair Art in Mangrol.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {['ALL', 'Haircuts', 'Beard', 'Skin Care', 'Packages'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat)}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition ${
              selectedFilter === cat
                ? 'bg-bronze text-charcoal-900 shadow-md'
                : 'bg-charcoal-800 text-ivory/70 hover:text-ivory hover:bg-charcoal-700'
            }`}
          >
            {cat === 'ALL' ? 'All Portfolio Works' : cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveModalItem(item)}
            className="group relative rounded-xl overflow-hidden bg-charcoal-800 border border-white/5 hover:border-bronze/40 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/30 to-transparent opacity-80 group-hover:opacity-90 transition"></div>

            <div className="absolute inset-x-0 bottom-0 p-5 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-bronze font-bold block">
                {item.category}
              </span>
              <h3 className="font-serif text-lg font-bold text-ivory flex items-center justify-between">
                <span>{item.title}</span>
                <Eye className="w-4 h-4 text-bronze opacity-0 group-hover:opacity-100 transition" />
              </h3>
              <p className="text-xs text-ivory/60 line-clamp-1">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Photo lightbox modal */}
      {activeModalItem && (
        <div
          onClick={() => setActiveModalItem(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-charcoal-800 border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative"
          >
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-charcoal-900/80 text-ivory/80 hover:text-ivory flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="aspect-[16/10] overflow-hidden bg-charcoal-900">
              <img
                src={activeModalItem.imageUrl}
                alt={activeModalItem.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 space-y-2">
              <span className="text-xs uppercase tracking-wider text-bronze font-semibold">
                {activeModalItem.category}
              </span>
              <h3 className="font-serif text-2xl font-bold text-ivory">
                {activeModalItem.title}
              </h3>
              <p className="text-sm text-ivory/70 leading-relaxed">
                {activeModalItem.description}
              </p>
              
              <div className="pt-4 border-t border-white/5 flex justify-end">
                <Link
                  to="/book"
                  onClick={() => setActiveModalItem(null)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs hover:bg-bronze-light transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Similar Cut</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
