import React, { useState, useMemo, useEffect } from 'react';
import { PastPaper, Medium } from '../types';
import { supabaseService } from '../services/supabaseService';
import { 
  FileText, 
  Search, 
  ArrowRight, 
  Download, 
  CheckCircle2, 
  Filter, 
  BookOpen, 
  Sparkles,
  Layers, 
  Calendar,
  Eye,
  Check,
  ShieldCheck,
  ExternalLink,
  Info,
  Loader2
} from 'lucide-react';

interface PastPapersViewProps {
  onSelectPaper: (paper: PastPaper) => void;
}

export const PastPapersView: React.FC<PastPapersViewProps> = ({ onSelectPaper }) => {
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMedium, setSelectedMedium] = useState<Medium | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  useEffect(() => {
    supabaseService.getPastPapers()
      .then(res => {
        setPapers(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const availableYears = [2025, 2024, 2023, 2022, 2021];
  const categories = ['all', 'Final Exam', 'Model Paper', 'Mid-Term Assessment'];

  // Filter papers strictly from database/R2
  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      const matchesYear = selectedYear === 'all' || paper.year === selectedYear;
      const matchesMedium = selectedMedium === 'all' || paper.medium === selectedMedium;
      const matchesCategory = selectedCategory === 'all' || paper.category === selectedCategory;
      const matchesSearch = 
        searchQuery === '' ||
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.year.toString().includes(searchQuery);
      return matchesYear && matchesMedium && matchesCategory && matchesSearch;
    });
  }, [papers, selectedYear, selectedMedium, selectedCategory, searchQuery]);

  const handleDownload = (e: React.MouseEvent, paper: PastPaper) => {
    e.stopPropagation();
    setDownloadingId(paper.id);
    
    const fileUrl = paper.fileUrl || supabaseService.resolveR2Url(paper.filePath);
    if (fileUrl) {
      const element = document.createElement('a');
      element.href = fileUrl;
      element.download = `${paper.title.replace(/\s+/g, '_')}.pdf`;
      element.target = '_blank';
      element.rel = 'noreferrer';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
    setDownloadingId(null);
    setDownloadSuccessId(paper.id);
    setTimeout(() => setDownloadSuccessId(null), 3000);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-24 text-left">
      
      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION: Ambient background glow, badge & massive title
         ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-2 sm:pt-6 overflow-hidden">
        {/* Soft Ambient Radial Background Glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[450px] bg-blue-300/20 rounded-full blur-[140px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-sky-200/25 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.2em] text-blue-700 font-bold">
              NATIONAL REPOSITORY // G.C.E. A/L ARCHIVES
            </span>
            <span aria-hidden="true">·</span>
            <span>Standardized Department Marking Schemes</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
            Official Past Examination Archives &amp;{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              Evaluation Schemes
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Access certified Sri Lankan General Certificate of Education (A/L) Accounting examination materials. 
            Every paper is accompanied by verified marking schemes, point allocations, and detailed teacher review guides.
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BENTO STAT SUMMARY CARDS: Slick counters matching homepage
           ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-10">
          <div className="p-5 sm:p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              COVERAGE
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-950 font-sans tracking-tight">
                2021–2025
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Full 5-Year Archive Set</span>
          </div>

          <div className="p-5 sm:p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
              MARKING SCHEMES
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 font-sans tracking-tight">
                100%
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1 block">With Step-by-Step Scoring</span>
          </div>

          <div className="p-5 sm:p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 block">
              LANGUAGES
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black text-blue-600 font-sans tracking-tight">
                3 Mediums
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Sinhala · English · Tamil</span>
          </div>

          <div className="p-5 sm:p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              VERIFICATION
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-950 font-sans tracking-tight">
                Certified
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Dept of Examinations Std</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SEARCH & FILTER CONTROL SUITE: Extra Large, Prominent Search Panel
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[32px] shadow-lg space-y-4">
          
          {/* Main Large Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by examination year (e.g. 2024), medium (Sinhala/English), paper title, or topic..."
              className="w-full pl-12 sm:pl-15 pr-20 sm:pr-24 py-3.5 sm:py-4 text-sm sm:text-base rounded-2xl bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 text-slate-900 transition-all font-sans placeholder:text-slate-400 shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Bar: Years & Mediums */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Year Selector Pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200/80 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    selectedYear === 'all'
                      ? 'bg-slate-950 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  All Years
                </button>
                {availableYears.map(yr => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                      selectedYear === yr
                        ? 'bg-slate-950 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              {/* Medium Selector Pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200/80 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All Mediums' },
                  { id: 'sinhala', label: 'Sinhala' },
                  { id: 'english', label: 'English' },
                  { id: 'tamil', label: 'Tamil' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMedium(m.id as Medium | 'all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                      selectedMedium === m.id
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Quick Result Counter & Reset */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>Showing <strong className="text-slate-900">{filteredPapers.length}</strong> examination documents</span>
              {(selectedYear !== 'all' || selectedMedium !== 'all' || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setSelectedYear('all');
                    setSelectedMedium('all');
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-blue-600 hover:underline font-bold"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          PAST PAPERS BENTO GRID: Premium rounded cards with crisp micro-UI
         ───────────────────────────────────────────────────────────── */}
      <section>
        {loading ? (
          <div className="p-16 text-center rounded-[32px] bg-white/80 border border-slate-200/80 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Connecting to Repository &amp; R2 Storage...</h3>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="p-16 text-center rounded-[32px] bg-white/80 border border-slate-200/80 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-black text-slate-900">No examination documents found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {papers.length === 0 
                  ? 'No past examination papers or tutes are currently registered in the database. When curriculum materials are added in the Database or Cloudflare R2 Storage, they will automatically appear here.'
                  : 'No papers match your selected year, language medium, or search query. Try resetting your search filters.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => {
              const isDownloading = downloadingId === paper.id;
              const isDownloaded = downloadSuccessId === paper.id;

              return (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className="rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer p-6 sm:p-7 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div className="space-y-4">
                    {/* Top Row: Year Pill, Medium Badge, Category */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-950 text-white shadow-2xs">
                          #{paper.year}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          paper.medium === 'sinhala'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : paper.medium === 'english'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {paper.medium} Medium
                        </span>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        {paper.category}
                      </span>
                    </div>

                    {/* Paper Title & Subtitle */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                        {paper.subject}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {paper.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {paper.subtitle}
                      </p>
                    </div>

                    {/* Meta Specs Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-500 font-mono">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100">
                        {paper.pages} Pages
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100">
                        {paper.fileSize}
                      </span>
                      {paper.hasMarkingScheme && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Marking Scheme</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Row: View PDF + Download */}
                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPaper(paper);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-full bg-slate-950 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 group-hover:bg-blue-600"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, paper)}
                      disabled={isDownloading}
                      className={`p-2.5 rounded-full border transition-all active:scale-95 ${
                        isDownloaded
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                      title="Download PDF document"
                    >
                      {isDownloading ? (
                        <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin block" />
                      ) : isDownloaded ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          EXAMINER GUIDELINES & STRATEGY BENTO CARD (Matching Homepage depth)
         ───────────────────────────────────────────────────────────── */}
      <section className="p-7 sm:p-10 rounded-[32px] bg-gradient-to-r from-slate-950 via-[#0B1528] to-blue-950 text-white shadow-[0_16px_50px_rgba(15,23,42,0.14)] border border-slate-800 relative overflow-hidden">
        {/* Glow & Monogram Watermark */}
        <div className="absolute -top-16 -right-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="absolute right-6 bottom-2 text-white/5 font-black text-9xl tracking-tighter select-none font-sans pointer-events-none">
          AL
        </span>

        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/70 border border-blue-500/30 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>EXAMINATION BOARD CURRICULUM NOTES</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Official Examination Structure &amp; Mark Allocations
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-2xl">
              Recommendations by Mrs. Ruwanthi Senanayaka on scoring maximum marks in G.C.E. A/L Accounting:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 block">
                PART I — 50 MCQs
              </span>
              <p className="text-xs font-semibold text-white">2 Hours Duration · 100 Marks</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Focus on rapid conceptual calculation, accounting equations, and eliminating misleading answer distractors.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                PART II — STRUCTURED
              </span>
              <p className="text-xs font-semibold text-white">3 Hours Duration · 100 Marks</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Step marks are awarded for ledger double-entries, LKAS note presentation, and working schedule calculations.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 block">
                LKAS STANDARDS
              </span>
              <p className="text-xs font-semibold text-white">LKAS 01, 02, 07 &amp; 16</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mandatory disclosure requirements carry specific step marks in Published Financial Statement problems.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
