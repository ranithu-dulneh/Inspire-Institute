import React, { useState } from 'react';
import { VideoModule } from '../types';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { 
  ListOrdered, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Download,
  FileText
} from 'lucide-react';

interface VideoPlayerModalProps {
  video: VideoModule | null;
  onClose: () => void;
}

const parseTimeString = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(p => parseInt(p, 10));
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  } else if (parts.length === 2) {
    return (parts[0] * 60) + (parts[1] || 0);
  }
  return 0;
};

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  const [activeSideTab, setActiveSideTab] = useState<'chapters' | 'notes'>('chapters');
  const [completedChapters, setCompletedChapters] = useState<number[]>([0]);
  const [seekTargetTime, setSeekTargetTime] = useState<number | null>(null);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [totalDurationSec, setTotalDurationSec] = useState<number>(3600);

  if (!video) return null;

  const toggleChapter = (index: number) => {
    if (completedChapters.includes(index)) {
      setCompletedChapters(completedChapters.filter(i => i !== index));
    } else {
      setCompletedChapters([...completedChapters, index]);
    }
  };

  const handleSelectChapter = (chap: { title: string; time: string }, index: number) => {
    const seconds = parseTimeString(chap.time);
    setSeekTargetTime(seconds);
    if (!completedChapters.includes(index)) {
      setCompletedChapters(prev => [...prev, index]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col lg:flex-row w-full max-w-6xl h-[94vh] max-h-[860px] bg-slate-950 rounded-3xl md:rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Video Viewport (70% on desktop) with Unified In-Video Custom Player */}
        <div className="flex-1 flex flex-col justify-center bg-black relative overflow-hidden">
          <CustomVideoPlayer
            video={video}
            onClose={onClose}
            onTimeUpdate={(curr, dur) => {
              setCurrentTimeSec(curr);
              if (dur > 0) setTotalDurationSec(dur);
            }}
            seekToTime={seekTargetTime}
            onSeekHandled={() => setSeekTargetTime(null)}
          />
        </div>

        {/* Right Sidebar: Chapters & Notes Panel (30% on desktop) */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col bg-white">
          
          {/* Light Tabs */}
          <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50/70">
            <button
              onClick={() => setActiveSideTab('chapters')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeSideTab === 'chapters'
                  ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Lesson Plan</span>
            </button>

            <button
              onClick={() => setActiveSideTab('notes')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeSideTab === 'notes'
                  ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>LKAS Notes</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeSideTab === 'chapters' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pb-1 font-sans">
                  <span>{video.chapters.length} Curriculum Topics</span>
                  <span>{completedChapters.length}/{video.chapters.length} Completed</span>
                </div>

                {video.chapters.map((chap, idx) => {
                  const isDone = completedChapters.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectChapter(chap, idx)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 text-left border ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200/60 text-slate-900'
                          : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapter(idx);
                        }}
                        className={`mt-0.5 rounded-full p-0.5 ${isDone ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}
                        title={isDone ? 'Mark as unwatched' : 'Mark as completed'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate font-sans">
                          {chap.title}
                        </p>
                        <div className="text-[11px] text-blue-600 font-sans font-medium mt-0.5">
                          <span>Lecture Topic #{idx + 1}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>LKAS Standard Focus</span>
                  </div>
                  <p className="text-[11px] text-blue-700/90 leading-relaxed">
                    Official accounting standard guidelines relevant to this lecture block.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Key Takeaways</h4>
                  {video.notesSummary.map((note, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      • {note}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Lecture PDF</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Student Support info */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Click timestamp to jump directly to lesson section.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
