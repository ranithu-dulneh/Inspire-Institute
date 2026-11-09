import React, { useState, useMemo, useEffect } from 'react';
import { StudyMaterial } from '../types';
import { supabaseService } from '../services/supabaseService';
import { 
  ShoppingBag, 
  Download, 
  Star, 
  CheckCircle2, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Search, 
  Filter, 
  Check, 
  Package, 
  Layers, 
  ArrowRight,
  Loader2
} from 'lucide-react';

interface StudyMaterialsStoreProps {
  onAddToCart: (material: StudyMaterial) => void;
}

export const StudyMaterialsStore: React.FC<StudyMaterialsStoreProps> = ({
  onAddToCart
}) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    supabaseService.getStudyMaterials()
      .then(res => {
        setMaterials(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = [
    'All',
    'Lesson Wise Tutes',
    'Revision Notes',
    'Past Paper Books',
    'Model Papers'
  ];

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
      const matchesSearch = 
        searchQuery === '' ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [materials, selectedCategory, searchQuery]);

  const handleFreeDownload = (material: StudyMaterial) => {
    setDownloadNotice(material.title);
    const fileUrl = material.fileUrl || supabaseService.resolveR2Url(material.filePath);
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${material.title.replace(/\s+/g, '_')}.pdf`;
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setTimeout(() => {
      setDownloadNotice(null);
    }, 3500);
  };

  const handleAdd = (mat: StudyMaterial) => {
    onAddToCart(mat);
    setAddedId(mat.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-24 text-left">
      
      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION: Ambient background glow, badge & massive title
         ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-2 sm:pt-6 overflow-hidden">
        {/* Soft Ambient Radial Background Glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[450px] bg-blue-300/20 rounded-full blur-[140px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-amber-200/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="space-y-4 max-w-4xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
            Curated Study Handbooks &amp;{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 bg-clip-text text-transparent">
              Revision Compendiums
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Essential accounting publications, classified topical question banks, and complete worked solution manuals prepared specifically for national examination candidates.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SEARCH & CATEGORY FILTER CONTROL BAR
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="p-4 sm:p-5 rounded-[28px] bg-white/80 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input Field */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tutes, theory notes, handbook titles..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-mono"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Result Counter */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
            <span>Showing <strong className="text-slate-900">{filteredMaterials.length}</strong> publication items</span>
            {(selectedCategory !== 'All' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:underline font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Free Download Confirmation Alert */}
      {downloadNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Downloading <strong>{downloadNotice}</strong>...</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">PDF Ready</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STORE ITEMS BENTO GRID: Real materials from Database & R2 Storage
         ───────────────────────────────────────────────────────────── */}
      <section>
        {loading ? (
          <div className="p-16 text-center rounded-[32px] bg-white/80 border border-slate-200/80 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Loading Study Materials...</h3>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-16 text-center rounded-[32px] bg-white/80 border border-slate-200/80 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-black text-slate-900">No study materials found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {materials.length === 0 
                  ? 'No study handbooks or tutes are currently available. Please check back soon.'
                  : 'No publications match your selected category or search query. Try resetting your search filters.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((mat) => {
              const displayPrice = `Rs. ${mat.priceLKR.toLocaleString()}`;
              const isAdded = addedId === mat.id;

              return (
                <div 
                  key={mat.id}
                  className="rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] hover:border-blue-400 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between overflow-hidden"
                >
                  
                  {/* Visual Handbook Cover Area */}
                  <div className="relative aspect-[16/9] w-full bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 p-5 flex flex-col justify-between overflow-hidden">
                    {/* Glowing Accent */}
                    <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

                    {/* Top Badges */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white backdrop-blur-md border border-white/15">
                        {mat.batchTag}
                      </span>
                      {mat.isFree ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/70 border border-emerald-500/30">
                          FREE DIGITAL
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30">
                          {mat.format}
                        </span>
                      )}
                    </div>

                    {/* Center Icon & Pages */}
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                        <BookOpen className="w-5 h-5 text-blue-300" />
                      </div>
                      <div>
                        <span className="text-white font-mono text-xs font-bold block">{mat.pageCount} Pages</span>
                        <span className="text-slate-400 text-[10px] font-mono block">{mat.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                          {mat.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-800">{mat.rating}</span>
                          <span className="text-slate-400">({mat.reviewsCount})</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {mat.title}
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {mat.description}
                      </p>
                    </div>

                    {/* Price and Action Button Row */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        {mat.isFree ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-emerald-600">Free</span>
                            <span className="text-[10px] text-slate-400 font-mono">Instant PDF</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1 font-mono">
                            <span className="text-lg font-black text-slate-950">
                              {displayPrice}
                            </span>
                            <span className="text-[10px] text-slate-400">Net</span>
                          </div>
                        )}
                      </div>

                      {mat.isFree ? (
                        <button
                          type="button"
                          onClick={() => handleFreeDownload(mat)}
                          className="py-2.5 px-4 rounded-full bg-slate-950 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(mat)}
                          className={`py-2.5 px-4 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95 ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-950 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          COURIER & PRINTING QUALITY GUARANTEE BENTO CARD
         ───────────────────────────────────────────────────────────── */}
      <section className="p-7 sm:p-10 rounded-[32px] bg-gradient-to-r from-slate-950 via-[#0B1528] to-blue-950 text-white shadow-[0_16px_50px_rgba(15,23,42,0.14)] border border-slate-800 relative overflow-hidden">
        {/* Glow & Monogram Watermark */}
        <div className="absolute -top-16 -right-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="absolute right-6 bottom-2 text-white/5 font-black text-9xl tracking-tighter select-none font-sans pointer-events-none">
          KIT
        </span>

        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/70 border border-blue-500/30 px-3 py-1 rounded-full">
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span>PRINT PUBLICATION &amp; DELIVERY GUARANTEE</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Official Sri Lanka Island-Wide Express Shipping
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-2xl">
              Printed handbooks are published on premium 80 GSM paper with durable wire-O binding for easy desk study during intensive revision sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 block">
                DELIVERY TIME
              </span>
              <p className="text-xs font-semibold text-white">1–3 Working Days Island-Wide</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Direct tracked courier delivery to Western, Southern, Central, Northern, and Eastern provinces.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                PAYMENT METHODS
              </span>
              <p className="text-xs font-semibold text-white">Bank Transfer · Cards · Slip Upload</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Seamless local checkout in LKR with bank deposit receipt verification or instant credit card payment.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                FREE DIGITAL COPY
              </span>
              <p className="text-xs font-semibold text-white">Included With Every Physical Order</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Receive instant high-resolution PDF download access while your physical handbook is on its way.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
