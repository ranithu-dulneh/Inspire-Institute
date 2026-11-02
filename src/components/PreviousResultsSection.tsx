import React from 'react';
import { Play, FileText, ChevronRight, Award, ExternalLink } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export interface RankerResultItem {
  id: string;
  year: string;
  rankTitle: string;
  studentName: string;
  school?: string;
  indexNo: string;
  note?: string;
  imageUrl?: string; // Configurable image from backend / storage
  videoHighlightUrl?: string;
}

export const defaultResultsData: RankerResultItem[] = [];

interface PreviousResultsSectionProps {
  onViewFullRegister?: () => void;
  onWatchHighlight?: (item: RankerResultItem) => void;
  results?: RankerResultItem[];
}

export const PreviousResultsSection: React.FC<PreviousResultsSectionProps> = ({
  onViewFullRegister,
  onWatchHighlight,
  results = defaultResultsData
}) => {
  return (
    <section id="results" className="space-y-10 text-left pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* ─────────────────────────────────────────────────────────────
            LEFT COLUMN: Heading + Bento Stats Box (Screenshot 00.00.40)
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-8">
          <ScrollReveal direction="up" delay={60}>
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>RESULTS</span>
            </div>

            {/* Heading in English */}
            <div className="space-y-3.5 pt-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
                An Unrivalled Legacy of <br />
                <span className="text-emerald-700">Academic Results</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                The classroom that rewrote A/L Accounting history. Setting national benchmark records and delivering historic university entrants year after year.
              </p>
            </div>
          </ScrollReveal>

          {/* Bento Stats Box matching Screenshot 2026-10-07 at 00.00.40.png */}
          <ScrollReveal direction="up" delay={160}>
            <div className="p-7 sm:p-8 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/70 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] space-y-5">
              
              {/* Top 2 Big Island Rank Tiles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/60 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    A/L 2025
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-950 font-sans tracking-tight mt-1">
                    #1
                  </div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mt-1">
                    ● ISLAND RANK
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                    Sadini Nimnathara
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Maliyadeva Balika
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/60 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    A/L 2022
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-950 font-sans tracking-tight mt-1">
                    #5
                  </div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mt-1">
                    ● ISLAND RANK
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                    Anupama Kenulda
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Index: 2102633
                  </p>
                </div>
              </div>

              {/* 4 Quantitative Metric Badges */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-700 font-sans">19</span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                      District Top 10 Ranks
                    </span>
                    <span className="text-[10px] text-slate-500">2024 · District Level</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-700 font-sans">18</span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                      District Top 10 Ranks
                    </span>
                    <span className="text-[10px] text-slate-500">2022/2023 · District Level</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-950 font-sans">149</span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                      'A' Passes
                    </span>
                    <span className="text-[10px] text-slate-500">2024 · Accounting</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-950 font-sans">180</span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                      'B' Passes
                    </span>
                    <span className="text-[10px] text-slate-500">2024 · Accounting</span>
                  </div>
                </div>
              </div>

              {/* View Historical Results Register Button */}
              <div className="pt-2">
                <button
                  onClick={onViewFullRegister}
                  className="w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Complete Results Register</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

            </div>
          </ScrollReveal>

        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT COLUMN: 2 Feature Rankers with Backend Configurable Images
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {results.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Official Examination Results Register</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Verified island ranker results, national merit scores, and video testimonials will be featured here once registered in the system.
                </p>
              </div>
            </div>
          ) : (
            results.map((item, idx) => (
              <ScrollReveal key={item.id} direction="up" delay={180 + idx * 120}>
                <div 
                  className="p-7 sm:p-9 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-emerald-200 transition-all text-left"
                >
                  {/* Text Info */}
                  <div className="space-y-4 w-full md:w-1/2">
                    <span className="text-xs font-semibold text-slate-400 block">
                      {item.year}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
                      {item.rankTitle}
                    </h3>
                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">
                        {item.studentName}
                      </h4>
                      {item.school && (
                        <p className="text-xs text-slate-500">{item.school}</p>
                      )}
                      <p className="text-xs font-medium text-slate-400">{item.indexNo}</p>
                    </div>

                    {item.note && (
                      <p className="text-xs text-emerald-700 font-semibold pt-1">
                        {item.note}
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => onWatchHighlight && onWatchHighlight(item)}
                        className="px-6 py-3 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Watch Highlight</span>
                      </button>
                    </div>
                  </div>

                  {/* Student and Tutor Visual Card (Configurable from backend) */}
                  <div className="w-full md:w-1/2 aspect-[4/3] rounded-2xl bg-gradient-to-tr from-slate-900 via-teal-950 to-slate-900 border border-white/60 p-5 flex flex-col items-center justify-center text-center text-white relative overflow-hidden shadow-md">
                    
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={`${item.studentName} with Tutor`} 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      /* Verified Achievement composition */
                      <div className="flex flex-col items-center justify-center space-y-3 p-3">
                        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <Award className="w-7 h-7 text-amber-300" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                          {item.rankTitle} · {item.year}
                        </span>
                        <p className="text-xs text-slate-200 font-medium max-w-xs leading-relaxed">
                          {item.studentName} with Lead Faculty Mrs. Ruwanthi Senanayaka
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              </ScrollReveal>
            ))
          )}
        </div>

      </div>
    </section>
  );
};
