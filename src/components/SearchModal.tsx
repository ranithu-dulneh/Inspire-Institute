import React, { useState, useEffect, useRef } from 'react';
import { PastPaper, VideoModule, StudyMaterial } from '../types';
import { Search, FileText, Video, BookOpen, ChevronRight, X, Sparkles } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastPapers: PastPaper[];
  videos: VideoModule[];
  materials: StudyMaterial[];
  onSelectPaper: (paper: PastPaper) => void;
  onSelectVideo: (video: VideoModule) => void;
  onSelectMaterial: (material: StudyMaterial) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  pastPapers,
  videos,
  materials,
  onSelectPaper,
  onSelectVideo,
  onSelectMaterial
}) => {
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPapers = pastPapers.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.subject.toLowerCase().includes(query.toLowerCase()) ||
    p.year.toString().includes(query) ||
    p.medium.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(query.toLowerCase()) ||
    v.topic.toLowerCase().includes(query.toLowerCase()) ||
    v.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(query.toLowerCase()) ||
    m.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    m.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const hasResults = filteredPapers.length > 0 || filteredVideos.length > 0 || filteredMaterials.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Spotlight Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/80 bg-white/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, videos, tutes, LKAS standards..."
            className="w-full bg-transparent text-sm md:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-sans text-slate-400 bg-slate-100 rounded border border-slate-200">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Deck */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          {query.trim() === '' ? (
            <div className="p-4 text-center text-slate-400 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-blue-500 opacity-60" />
              <p className="text-slate-600 font-medium">Quick Academic Search</p>
              <p className="text-[11px] text-slate-400">
                Try searching for "2024 Accounting", "Cash Flow", "Partnership", or "Marking Scheme"
              </p>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-slate-400">
              No matching academic materials found for "{query}".
            </div>
          ) : (
            <>
              {/* Past Papers Section */}
              {filteredPapers.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    Past Papers ({filteredPapers.length})
                  </div>
                  <div className="space-y-1">
                    {filteredPapers.map(paper => (
                      <div
                        key={paper.id}
                        onClick={() => {
                          onSelectPaper(paper);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{paper.title}</p>
                            <p className="text-[11px] text-slate-500 capitalize">{paper.year} · {paper.medium} Medium · {paper.category}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Modules Section */}
              {filteredVideos.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    Recorded Video Modules ({filteredVideos.length})
                  </div>
                  <div className="space-y-1">
                    {filteredVideos.map(video => (
                      <div
                        key={video.id}
                        onClick={() => {
                          onSelectVideo(video);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{video.title}</p>
                            <p className="text-[11px] text-slate-500">{video.duration} · {video.month} Session · {video.topic}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Materials Section */}
              {filteredMaterials.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    Study Materials & Tutes ({filteredMaterials.length})
                  </div>
                  <div className="space-y-1">
                    {filteredMaterials.map(mat => (
                      <div
                        key={mat.id}
                        onClick={() => {
                          onSelectMaterial(mat);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{mat.title}</p>
                            <p className="text-[11px] text-slate-500">{mat.isFree ? 'Free' : `LKR ${mat.priceLKR.toLocaleString()}`} · {mat.batchTag} · {mat.category}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or arrow keys</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
