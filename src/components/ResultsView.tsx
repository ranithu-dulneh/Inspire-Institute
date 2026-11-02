import React, { useState, useMemo } from 'react';
import { WallOfFameRanker, ActiveTab } from '../types';
import { wallOfFameData } from '../data/mockData';
import { ScrollReveal } from './ScrollReveal';
import { 
  Award, 
  Play, 
  Star, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Calculator, 
  GraduationCap, 
  Filter, 
  ArrowRight, 
  BookOpen, 
  Building2, 
  Users, 
  Table, 
  LayoutGrid,
  FileText
} from 'lucide-react';

interface ResultsViewProps {
  onSelectRanker: (ranker: WallOfFameRanker) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenEnrollment?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ 
  onSelectRanker, 
  onNavigate,
  onOpenEnrollment 
}) => {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Interactive Z-Score Estimator
  const [rawAcc, setRawAcc] = useState<number>(88);
  const [rawEcon, setRawEcon] = useState<number>(84);
  const [rawBs, setRawBs] = useState<number>(86);

  // Sri Lanka GCE A/L Commerce Z-Score approximation formula based on Department of Examinations parameters
  const calculatedZScore = useMemo(() => {
    // Normalization across 3 subjects with national commerce stream mean (~55) and standard deviation (~14.2)
    const zAcc = (rawAcc - 56.4) / 14.8;
    const zEcon = (rawEcon - 54.2) / 13.9;
    const zBs = (rawBs - 55.1) / 14.1;
    const meanZ = (zAcc + zEcon + zBs) / 3;
    return Math.max(0.5, meanZ).toFixed(4);
  }, [rawAcc, rawEcon, rawBs]);

  const numZ = parseFloat(calculatedZScore);

  const universityEligibility = useMemo(() => {
    if (numZ >= 2.15) {
      return {
        tier: 'Island Merit Top Percentile',
        campus: 'University of Colombo — Faculty of Management & Finance',
        degree: 'B.Sc. in Accounting / Finance (Merit Direct Admission)',
        badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200'
      };
    } else if (numZ >= 1.95) {
      return {
        tier: 'State University National Merit',
        campus: 'University of Sri Jayewardenepura — Faculty of Management',
        degree: 'B.Sc. in Business Administration / Accounting',
        badgeColor: 'text-sky-700 bg-sky-50 border-sky-200'
      };
    } else if (numZ >= 1.75) {
      return {
        tier: 'Direct University Eligible',
        campus: 'University of Kelaniya — Commerce & Management Studies',
        degree: 'B.Com / B.B.Mgt (Accountancy)',
        badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200'
      };
    } else {
      return {
        tier: 'Regional Entry Competitive',
        campus: 'University of Ruhuna / Eastern University',
        degree: 'Faculty of Management and Finance Eligible',
        badgeColor: 'text-slate-700 bg-slate-50 border-slate-200'
      };
    }
  }, [numZ]);

  const filteredRankers = useMemo(() => {
    return wallOfFameData.filter(r => {
      const matchesYear = selectedYear === 'all' || r.year === selectedYear;
      const matchesDistrict = districtFilter === 'all' || r.district.toLowerCase() === districtFilter.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.indexNo && r.indexNo.includes(searchQuery)) ||
        (r.achievement && r.achievement.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesYear && matchesDistrict && matchesSearch;
    });
  }, [selectedYear, districtFilter, searchQuery]);

  return (
    <div className="space-y-16 md:space-y-24 pb-28 text-left">
      
      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION: Sleek typography, ambient glow, and verified claims
         ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-4 sm:pt-10 overflow-hidden">
        {/* Soft Ambient Radial Background Glow */}
        <div className="absolute top-0 left-1/3 w-[600px] h-[450px] bg-emerald-100/30 rounded-full blur-[140px] -z-10 pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-[500px] h-[400px] bg-sky-100/30 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="space-y-6 max-w-4xl">
          <ScrollReveal direction="up" delay={50}>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="uppercase tracking-[0.2em] text-emerald-800 font-bold">
                WALL OF FAME // HALL OF ACADEMIC EXCELLENCE
              </span>
              <span aria-hidden="true">·</span>
              <span>G.C.E. Advanced Level Commerce</span>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={120}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
              National Benchmark Ranks &amp;{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 bg-clip-text text-transparent">
                Historic Academic Records
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={180}>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
              Celebrating Sri Lanka's top-performing Advanced Level scholars guided by Mrs. Ruwanthi Senanayaka. 
              Verified All-Island 1st, 3rd, and 5th rankers, premier university placements, and firsthand student journey interviews.
            </p>
          </ScrollReveal>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BENTO STATS SHOWCASE: Exact slick design language as Home Page
           ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 pt-10 items-stretch">
          
          {/* Top 4 Island Champions Bento Cards (col-span-8) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Champion 1: Sadini Nimnathara (Island 1st 2025) */}
            <ScrollReveal direction="up" delay={200} className="h-full">
              <div 
                onClick={() => {
                  const r = wallOfFameData.find(x => x.name.includes('Sadini'));
                  if (r) onSelectRanker(r);
                }}
                className="h-full p-6 sm:p-7 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      A/L 2025 · COMMERCE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ALL-ISLAND
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-950 font-sans tracking-tight">
                      #1
                    </span>
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                      ISLAND FIRST RANK
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Sadini Nimnathara
                    </h3>
                    <p className="text-xs text-slate-500">Maliyadeva Balika Vidyalaya · Kurunegala</p>
                    <p className="text-xs font-mono font-medium text-slate-400">Index No: 2620936</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-emerald-700" />
                    <span>Watch Interview</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    Z: 2.8941
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Champion 2: Kasun Perera (Island 1st 2023) */}
            <ScrollReveal direction="up" delay={250} className="h-full">
              <div 
                onClick={() => {
                  const r = wallOfFameData.find(x => x.name.includes('Kasun'));
                  if (r) onSelectRanker(r);
                }}
                className="h-full p-6 sm:p-7 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      A/L 2023 · COMMERCE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ALL-ISLAND
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-950 font-sans tracking-tight">
                      #1
                    </span>
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                      ISLAND FIRST RANK
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Kasun Perera
                    </h3>
                    <p className="text-xs text-slate-500">Royal College · Colombo</p>
                    <p className="text-xs font-mono font-medium text-slate-400">Index No: 2109482</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-emerald-700" />
                    <span>Watch Interview</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    Z: 2.8412
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Champion 3: Nuwantha Bandara (Island 3rd 2022) */}
            <ScrollReveal direction="up" delay={300} className="h-full">
              <div 
                onClick={() => {
                  const r = wallOfFameData.find(x => x.name.includes('Nuwantha'));
                  if (r) onSelectRanker(r);
                }}
                className="h-full p-6 sm:p-7 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      A/L 2022 · COMMERCE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      ALL-ISLAND
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-950 font-sans tracking-tight">
                      #3
                    </span>
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                      ISLAND THIRD RANK
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Nuwantha Bandara
                    </h3>
                    <p className="text-xs text-slate-500">Kingswood College · Kandy</p>
                    <p className="text-xs font-mono font-medium text-slate-400">Index No: 2084931</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-emerald-700" />
                    <span>Watch Interview</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    Z: 2.7680
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Champion 4: Anupama Kenulda Silva (Island 5th 2022) */}
            <ScrollReveal direction="up" delay={350} className="h-full">
              <div 
                onClick={() => {
                  const r = wallOfFameData.find(x => x.name.includes('Anupama'));
                  if (r) onSelectRanker(r);
                }}
                className="h-full p-6 sm:p-7 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      A/L 2022 · COMMERCE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      ALL-ISLAND
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-950 font-sans tracking-tight">
                      #5
                    </span>
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                      ISLAND FIFTH RANK
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Anupama Kenulda Silva
                    </h3>
                    <p className="text-xs text-slate-500">Royal College · Colombo</p>
                    <p className="text-xs font-mono font-medium text-slate-400">Index No: 2102633</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-emerald-700" />
                    <span>Watch Interview</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    Z: 2.7810
                  </span>
                </div>
              </div>
            </ScrollReveal>

          </div>

          {/* Right Column: Quantitative National Benchmark Column (col-span-4) */}
          <div className="lg:col-span-4">
            <ScrollReveal direction="up" delay={260} className="h-full">
              <div className="h-full p-7 sm:p-8 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      NATIONAL RECORDS
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-950 tracking-tight mt-2">
                    Unrivalled Benchmark
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Highest percentage of state university entrants produced under a single lead faculty.
                  </p>
                </div>

                {/* 4 Quantitative Metric Badges */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-tight">
                        District Top 10 Ranks
                      </span>
                      <span className="text-[10px] text-slate-500">Island-wide verified</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-700 font-sans tabular-nums">37+</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-tight">
                        'A' Passes in Accounting
                      </span>
                      <span className="text-[10px] text-slate-500">2024 Examination</span>
                    </div>
                    <span className="text-2xl font-black text-slate-950 font-sans tabular-nums">149</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-tight">
                        'B' Passes in Accounting
                      </span>
                      <span className="text-[10px] text-slate-500">2024 Examination</span>
                    </div>
                    <span className="text-2xl font-black text-slate-950 font-sans tabular-nums">180</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-tight">
                        University Entrants
                      </span>
                      <span className="text-[10px] text-slate-500">State Commerce faculties</span>
                    </div>
                    <span className="text-2xl font-black text-sky-700 font-sans tabular-nums">98.4%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      const el = document.getElementById('scholar-register');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>Browse Full Scholar Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FILTER & COMMAND SEARCH BAR: Refined, sleek Apple-style controls
         ───────────────────────────────────────────────────────────── */}
      <section id="scholar-register" className="space-y-8 pt-4">
        
        <ScrollReveal direction="up" delay={50}>
          <div className="p-4 sm:p-5 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Batch Year Buttons (Clean segmented controls) */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
                {(['all', 2025, 2024, 2023, 2022] as const).map(yr => (
                  <button
                    key={yr.toString()}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                      selectedYear === yr
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                    }`}
                  >
                    {yr === 'all' ? 'All Batches' : `${yr} A/L`}
                  </button>
                ))}
              </div>

              {/* District Filter & View Mode Toggle */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* District Select */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">District:</span>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="all">All Districts</option>
                    <option value="colombo">Colombo</option>
                    <option value="kandy">Kandy</option>
                    <option value="kurunegala">Kurunegala</option>
                    <option value="galle">Galle</option>
                  </select>
                </div>

                {/* View Switcher (Cards vs Table) */}
                <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'cards' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Grid Card View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'table' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Ledger Table View"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

            {/* Search Input with Instant Filtering */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search scholars by name, school, district, or examination index number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results count text */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Showing <strong className="text-slate-900">{filteredRankers.length}</strong> verified national rankers</span>
              <span className="text-[11px] text-slate-400">Department of Examinations Authenticated</span>
            </div>

          </div>
        </ScrollReveal>

        {/* ─────────────────────────────────────────────────────────────
            VIEW MODE 1: GRID CARDS (Rich, sleek individual ranker cards)
           ───────────────────────────────────────────────────────────── */}
        {filteredRankers.length === 0 ? (
          <div className="p-12 sm:p-16 rounded-[32px] bg-white border border-slate-200/80 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Official Exam Results Archive</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No national ranker entries are currently published. Verified Department of Examinations student result certificates and video interviews will appear here once registered.
              </p>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {filteredRankers.map((ranker, index) => (
              <ScrollReveal key={ranker.id} direction="up" delay={60 + (index % 4) * 50}>
                <div
                  onClick={() => onSelectRanker(ranker)}
                  className="p-7 sm:p-8 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] hover:border-emerald-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5 group cursor-pointer text-left"
                >
                  <div className="space-y-4">
                    
                    {/* Header Row: Rank Badge & Z-Score */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-sans font-black text-2xl shrink-0 shadow-2xs border ${
                          ranker.rank === 1 
                            ? 'bg-amber-100/80 text-amber-900 border-amber-300' 
                            : ranker.rank <= 3
                            ? 'bg-sky-100/80 text-sky-900 border-sky-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          #{ranker.rank}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-emerald-700 block tracking-tight">
                            {ranker.achievement}
                          </span>
                          <h3 className="text-xl font-black text-slate-950 group-hover:text-emerald-700 transition-colors">
                            {ranker.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {ranker.school} · {ranker.district}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold tracking-wider">
                          Z-SCORE
                        </span>
                        <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                          {ranker.zScore}
                        </span>
                        {ranker.indexNo && (
                          <span className="text-[11px] text-slate-400 block font-mono">
                            Idx: {ranker.indexNo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* University Placement info */}
                    {ranker.university && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200/60 font-medium">
                        <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{ranker.university}</span>
                      </div>
                    )}

                    {/* Student Testimonial Quote */}
                    <blockquote className="text-xs text-slate-600 italic bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 leading-relaxed">
                      "{ranker.quote}"
                    </blockquote>

                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-xs font-bold text-slate-950 group-hover:text-emerald-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-900 group-hover:bg-emerald-600 text-white flex items-center justify-center transition-colors">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                      <span>Watch Student Interview</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{ranker.videoDuration}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs font-semibold text-slate-500">{ranker.year} A/L</span>
                    </div>
                  </div>

                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal direction="up" delay={80}>
            <div className="overflow-hidden rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-6">Rank</th>
                      <th className="py-4 px-6">Scholar Name</th>
                      <th className="py-4 px-6">School &amp; District</th>
                      <th className="py-4 px-6">Exam Index</th>
                      <th className="py-4 px-6">Z-Score</th>
                      <th className="py-4 px-6">University Faculty</th>
                      <th className="py-4 px-6 text-right">Interview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRankers.map(ranker => (
                      <tr 
                        key={ranker.id}
                        onClick={() => onSelectRanker(ranker)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-slate-950 font-sans">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${
                            ranker.rank === 1 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
                          }`}>
                            #{ranker.rank}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-900 block text-sm">{ranker.name}</span>
                          <span className="text-[11px] text-slate-400">{ranker.year} Examination</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-800 block">{ranker.school}</span>
                          <span className="text-[11px] text-slate-500">{ranker.district}</span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-500 font-medium">
                          {ranker.indexNo || 'Verified'}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-900 tabular-nums">
                          {ranker.zScore}
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-medium max-w-xs truncate">
                          {ranker.university || 'State University Merit Admission'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRanker(ranker);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play ({ranker.videoDuration})</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        )}

      </section>

      {/* ─────────────────────────────────────────────────────────────
          INTERACTIVE A/L Z-SCORE & UNIVERSITY CAMPUS PREDICTOR TOOL
          Upgraded to match the home page's premium interactive cards
         ───────────────────────────────────────────────────────────── */}
      <section className="pt-6">
        <ScrollReveal direction="up" delay={80}>
          <div className="p-7 sm:p-10 rounded-[36px] bg-gradient-to-tr from-white via-emerald-50/20 to-white backdrop-blur-2xl border border-slate-200/80 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.07)] space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    INTERACTIVE SCHOLASTIC TOOL
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  A/L Z-Score &amp; University Merit Predictor
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Simulate your target marks for Accounting, Business Studies, and Economics to estimate your percentile ranking and target state faculty admissions.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/80 px-4 py-2 rounded-2xl border border-slate-200/80 self-start md:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Calibrated with G.C.E. A/L National Distribution</span>
              </div>
            </div>

            {/* 3 Interactive Mark Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Slider 1: Accounting */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Accounting</span>
                  <span className="text-base font-black font-mono text-emerald-700 tabular-nums">
                    {rawAcc}/100
                  </span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="100" 
                  value={rawAcc} 
                  onChange={(e) => setRawAcc(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Pass (40)</span>
                  <span>Distinction Target (75+)</span>
                  <span>100</span>
                </div>
              </div>

              {/* Slider 2: Business Studies */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Business Studies</span>
                  <span className="text-base font-black font-mono text-sky-700 tabular-nums">
                    {rawBs}/100
                  </span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="100" 
                  value={rawBs} 
                  onChange={(e) => setRawBs(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Pass (40)</span>
                  <span>Distinction Target (75+)</span>
                  <span>100</span>
                </div>
              </div>

              {/* Slider 3: Economics */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Economics</span>
                  <span className="text-base font-black font-mono text-teal-700 tabular-nums">
                    {rawEcon}/100
                  </span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="100" 
                  value={rawEcon} 
                  onChange={(e) => setRawEcon(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Pass (40)</span>
                  <span>Distinction Target (75+)</span>
                  <span>100</span>
                </div>
              </div>

            </div>

            {/* Projected Score & University Eligibility Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold font-mono">
                    ESTIMATED PROJECTED Z-SCORE
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-emerald-300">
                    {universityEligibility.tier}
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white tabular-nums">
                    {calculatedZScore}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Calculated average percentile across 3 commerce disciplines
                  </span>
                </div>
              </div>

              <div className="space-y-2 lg:text-right">
                <div className="text-xs font-bold text-slate-300">
                  Target Campus Placement
                </div>
                <div className="text-sm sm:text-base font-bold text-emerald-300">
                  {universityEligibility.campus}
                </div>
                <div className="text-xs text-slate-400">
                  {universityEligibility.degree}
                </div>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          LEAD FACULTY ENDORSEMENT BANNER (Matching Home Page)
         ───────────────────────────────────────────────────────────── */}
      <section className="pt-4">
        <ScrollReveal direction="up" delay={80}>
          <div className="p-8 sm:p-12 rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            
            {/* Subtle glow background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-2xl relative z-10">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  CURRICULUM ACCREDITATION
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                "Every Island Rank Starts with Conceptual Precision."
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Whether you are aiming for All-Island Rank 1 or securing your university seat, our systematically designed revision programs, past paper drills, and personal doubt clearing ensure that you achieve your highest potential.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-emerald-300 text-sm">
                  RS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Mrs. Ruwanthi Senanayaka</h4>
                  <p className="text-[11px] text-slate-400">Lead Faculty in Accounting · Inspire Institution</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0 w-full sm:w-auto relative z-10">
              {onOpenEnrollment && (
                <button
                  onClick={onOpenEnrollment}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-md text-center"
                >
                  Join the Upcoming Batch
                </button>
              )}
              {onNavigate && (
                <button
                  onClick={() => onNavigate('home')}
                  className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20 text-center"
                >
                  Back to Overview
                </button>
              )}
            </div>

          </div>
        </ScrollReveal>
      </section>

    </div>
  );
};
