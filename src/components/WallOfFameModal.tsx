import React, { useState } from 'react';
import { WallOfFameRanker } from '../types';
import { X, Award, Play, CheckCircle2, Star, Sparkles, Share2 } from 'lucide-react';

interface WallOfFameModalProps {
  ranker: WallOfFameRanker | null;
  onClose: () => void;
}

export const WallOfFameModal: React.FC<WallOfFameModalProps> = ({ ranker, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  if (!ranker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 bg-gradient-to-r from-amber-50/80 to-blue-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                National Top Ranker Spotlight
              </span>
              <h3 className="text-base font-bold text-slate-900">{ranker.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Simulation */}
        <div className="relative aspect-video w-full bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />

          {/* Golden Badge Overlay */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Island Rank #{ranker.rank}</span>
          </div>

          <div className="relative z-10 max-w-md space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-all">
              <Play className="w-6 h-6 fill-white ml-1 text-white" />
            </div>
            <h4 className="text-lg md:text-xl font-bold tracking-tight">
              "How I Structured My A/L Revision with Inspire"
            </h4>
            <p className="text-xs text-slate-300">
              Interview recorded at Inspire Colombo Auditorium · {ranker.videoDuration}
            </p>
          </div>
        </div>

        {/* Ranker Details & Testimonial */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Official Z-Score</span>
              <span className="text-base font-bold text-blue-700 font-sans tabular-nums">{ranker.zScore}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">School</span>
              <span className="text-xs font-semibold text-slate-800 line-clamp-1">{ranker.school}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Examination Year</span>
              <span className="text-base font-bold text-slate-900 font-sans">{ranker.year}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 leading-relaxed italic">
            "{ranker.quote}"
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Department of Examinations Result</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white apple-button-primary rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
