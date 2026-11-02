import React, { useState, useMemo, useEffect } from 'react';
import { VideoModule, LessonModule, LessonSession } from '../types';
import { 
  lessonService, 
  sessionToVideoModule, 
  MONTH_LIST, 
  BATCH_LIST 
} from '../services/lessonService';
import { 
  Play, 
  Clock, 
  Calendar, 
  Search, 
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Video,
  Layers,
  BookOpen,
  ArrowRight,
  Radio,
  ExternalLink,
  GraduationCap,
  Lock,
  Unlock,
  ShieldCheck
} from 'lucide-react';
import { CurrentUser } from '../types';
import { supabaseService } from '../services/supabaseService';
import { ModulePaymentModal, UnlockedModule } from './ModulePaymentModal';

interface VideoModulesViewProps {
  onSelectVideo: (video: VideoModule) => void;
  currentUser?: CurrentUser | null;
  onRequireLogin?: () => void;
}

type ModuleDisplayMode = 'lesson-wise' | 'monthly';

export const VideoModulesView: React.FC<VideoModulesViewProps> = ({ 
  onSelectVideo,
  currentUser,
  onRequireLogin
}) => {
  const [displayMode, setDisplayMode] = useState<ModuleDisplayMode>('lesson-wise');
  const [lessons, setLessons] = useState<LessonModule[]>(() => lessonService.getLessons());
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLessonIds, setExpandedLessonIds] = useState<Record<string, boolean>>({});
  
  // Unlocked month cache
  const [unlockedMonths, setUnlockedMonths] = useState<Record<string, boolean>>({});
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedModuleForPay, setSelectedModuleForPay] = useState<UnlockedModule | null>(null);

  const refreshMonthlyAccess = async () => {
    if (currentUser) {
      if (currentUser.role === 'Admin') {
        setUnlockedMonths({ all: true });
      } else {
        const accessList = await supabaseService.getStudentMonthlyAccess(currentUser.id);
        const map: Record<string, boolean> = {};
        accessList.forEach(a => {
          if (a.isActive) map[a.month.toLowerCase()] = true;
        });
        setUnlockedMonths(map);
      }
    } else {
      setUnlockedMonths({});
    }
  };

  useEffect(() => {
    refreshMonthlyAccess();

    const handleAccessUpdate = () => refreshMonthlyAccess();
    window.addEventListener('inspire-monthly-access-updated', handleAccessUpdate);
    window.addEventListener('inspire-slips-updated', handleAccessUpdate);

    return () => {
      window.removeEventListener('inspire-monthly-access-updated', handleAccessUpdate);
      window.removeEventListener('inspire-slips-updated', handleAccessUpdate);
    };
  }, [currentUser]);

  // Sync with Supabase on mount
  useEffect(() => {
    lessonService.syncWithSupabase()
      .then(synced => setLessons(synced))
      .catch(() => {});

    // Listen to real-time additions from Admin Dashboard
    const handleUpdate = () => {
      setLessons(lessonService.getLessons());
    };
    window.addEventListener('inspire-lessons-updated', handleUpdate);
    return () => window.removeEventListener('inspire-lessons-updated', handleUpdate);
  }, []);

  // Set first 2 lessons open by default
  useEffect(() => {
    if (lessons.length > 0 && Object.keys(expandedLessonIds).length === 0) {
      const initial: Record<string, boolean> = {};
      lessons.slice(0, 3).forEach(l => {
        initial[l.id] = true;
      });
      setExpandedLessonIds(initial);
    }
  }, [lessons]);

  const toggleLessonExpanded = (id: string) => {
    setExpandedLessonIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Derive unique months available across all sessions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    lessons.forEach(les => {
      les.sessions.forEach(s => {
        if (s.month) set.add(s.month);
      });
    });
    // Sort according to standard calendar order
    const sorted = Array.from(set).sort((a, b) => {
      const idxA = MONTH_LIST.indexOf(a);
      const idxB = MONTH_LIST.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
    return ['All', ...sorted];
  }, [lessons]);

  // Flattened sessions for monthly view & spotlight
  const allSessionsWithLesson = useMemo(() => {
    const list: { session: LessonSession; lesson: LessonModule }[] = [];
    lessons.forEach(lesson => {
      lesson.sessions.forEach(session => {
        list.push({ session, lesson });
      });
    });
    return list;
  }, [lessons]);

  // Filter lessons for Lesson-Wise View
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchesBatch = selectedBatch === 'All' || lesson.batch.toLowerCase().includes(selectedBatch.toLowerCase());
      
      const hasMatchingMonth = selectedMonth === 'All' || lesson.sessions.some(s => s.month === selectedMonth);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q === '' ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.description.toLowerCase().includes(q) ||
        lesson.batch.toLowerCase().includes(q) ||
        lesson.sessions.some(s => s.title.toLowerCase().includes(q) || s.month.toLowerCase().includes(q));

      return matchesBatch && hasMatchingMonth && matchesSearch;
    });
  }, [lessons, selectedBatch, selectedMonth, searchQuery]);

  // Filter sessions for Monthly View
  const filteredMonthlySessions = useMemo(() => {
    return allSessionsWithLesson.filter(({ session, lesson }) => {
      const matchesMonth = selectedMonth === 'All' || session.month === selectedMonth;
      const matchesBatch = selectedBatch === 'All' || lesson.batch.toLowerCase().includes(selectedBatch.toLowerCase());
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q === '' ||
        session.title.toLowerCase().includes(q) ||
        lesson.title.toLowerCase().includes(q) ||
        session.month.toLowerCase().includes(q);

      return matchesMonth && matchesBatch && matchesSearch;
    });
  }, [allSessionsWithLesson, selectedMonth, selectedBatch, searchQuery]);

  // Spotlight session for hero card
  const spotlightItem = allSessionsWithLesson[0];

  const isSessionUnlocked = (session: LessonSession) => {
    if (session.isFree) return true;
    if (currentUser?.role === 'Admin') return true;
    if (unlockedMonths.all) return true;
    return Boolean(unlockedMonths[session.month?.toLowerCase()]);
  };

  const handleSessionClick = (session: LessonSession, lesson?: LessonModule) => {
    if (isSessionUnlocked(session)) {
      const videoMod = sessionToVideoModule(session, lesson);
      onSelectVideo(videoMod);
    } else {
      handleUnlockMonth(session.month, lesson);
    }
  };

  const handleUnlockMonth = (month: string, lesson?: LessonModule) => {
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setSelectedModuleForPay({
      id: `mod-${month.toLowerCase()}`,
      batch: lesson?.batch || 'A/L Cohort',
      title: `${month} Curriculum Module`,
      month: month,
      priceLKR: lesson?.price || 3500,
      description: `Unlock all theory sessions, exam masterclasses, and downloadable materials for ${month}.`,
      isUnlocked: false
    });
    setPaymentModalOpen(true);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-24 text-left">
      
      {/* ─────────────────────────────────────────────────────────────
          HERO BANNER: Ambient glow, badges & typography
         ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-2 sm:pt-6 overflow-hidden">
        {/* Soft Ambient Radial Background Glow */}
        <div className="absolute top-0 left-1/3 w-[600px] h-[450px] bg-blue-300/20 rounded-full blur-[140px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-indigo-200/25 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="space-y-5 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.2em] text-blue-700 font-bold">
              ON-DEMAND REPOSITORY // HD LESSON MODULES
            </span>
            <span aria-hidden="true">·</span>
            <span>Recorded Theory &amp; Exam Masterclasses</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
            Comprehensive Lesson Modules &amp;{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              Lesson-Wise Sessions
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Stream high-definition lesson recordings organized both lesson-wise and by monthly cohort. 
            Each lesson includes interactive video sessions, timestamped chapters, and downloadable handouts.
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            FEATURED QUICK-RESUME SPOTLIGHT BENTO CARD
           ───────────────────────────────────────────────────────────── */}
        {spotlightItem && (
          <div className="mt-8 p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-slate-950 via-[#0B1528] to-blue-950 text-white shadow-[0_16px_50px_rgba(15,23,42,0.14)] border border-slate-800 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="relative z-10 space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-500/30">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>{spotlightItem.session.month} RECENT LESSON SESSION</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {spotlightItem.lesson.title}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {spotlightItem.session.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                {spotlightItem.session.description || spotlightItem.lesson.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-sans">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>{spotlightItem.session.duration}</span>
                </span>
                <span>·</span>
                <span className="font-medium">{spotlightItem.session.month} Cohort</span>
                <span>·</span>
                <span className="text-emerald-400 font-bold">1080p HD Studio Quality</span>
              </div>
            </div>

            <div className="relative z-10 shrink-0 w-full sm:w-auto flex sm:flex-col items-center justify-end gap-3">
              <button
                onClick={() => handleSessionClick(spotlightItem.session, spotlightItem.lesson)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Lesson Session</span>
              </button>
              <span className="text-[11px] text-slate-400 text-center hidden sm:block">
                On-demand access 24/7
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          DUAL-MODE SWITCHER & FILTER CONTROL BAR
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-3 bg-white/80 backdrop-blur-2xl border border-slate-200/80 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          {/* Mode Switcher: Lesson-Wise vs Monthly View */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
            <button
              onClick={() => setDisplayMode('lesson-wise')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                displayMode === 'lesson-wise'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lesson-Wise View</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-sans font-semibold ${
                displayMode === 'lesson-wise' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {lessons.length}
              </span>
            </button>

            <button
              onClick={() => setDisplayMode('monthly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                displayMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly Lesson Modules</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-sans font-semibold ${
                displayMode === 'monthly' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {allSessionsWithLesson.length}
              </span>
            </button>
          </div>

          {/* Month & Batch Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Month Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-full border border-slate-200/60 overflow-x-auto no-scrollbar max-w-full">
              {availableMonths.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedMonth === m
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  {m === 'All' ? 'All Months' : `${m}`}
                </button>
              ))}
            </div>

            {/* Batch Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-full border border-slate-200/60">
              {['All', ...BATCH_LIST].map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBatch(b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedBatch === b
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px] max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lesson or session title..."
              className="w-full pl-9 pr-10 py-2 text-xs rounded-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* Counter & Active filter feedback */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
          <span>
            {displayMode === 'lesson-wise' ? (
              <>Showing <strong className="text-slate-900">{filteredLessons.length}</strong> lesson modules ({filteredLessons.reduce((acc, l) => acc + l.sessions.length, 0)} total sessions)</>
            ) : (
              <>Showing <strong className="text-slate-900">{filteredMonthlySessions.length}</strong> monthly sessions across lessons</>
            )}
          </span>
          {(selectedMonth !== 'All' || selectedBatch !== 'All' || searchQuery !== '') && (
            <button
              onClick={() => {
                setSelectedMonth('All');
                setSelectedBatch('All');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: LESSON-WISE VIEW (All Lessons with Nested Sessions)
         ───────────────────────────────────────────────────────────── */}
      {displayMode === 'lesson-wise' && (
        <section className="space-y-6">
          {filteredLessons.length === 0 ? (
            <div className="p-12 text-center rounded-[32px] bg-white/80 border border-slate-200/80 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No lesson modules found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No lessons match your current month or search criteria. Try selecting "All Months" or resetting filters.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredLessons.map((lesson, idx) => {
                const isExpanded = expandedLessonIds[lesson.id] ?? false;
                const totalDuration = lesson.sessions.reduce((acc, s) => {
                  return acc + (s.duration ? parseInt(s.duration, 10) || 100 : 90);
                }, 0);

                return (
                  <div
                    key={lesson.id}
                    className="rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] overflow-hidden transition-all duration-300"
                  >
                    {/* Lesson Header Accordion Trigger */}
                    <div 
                      onClick={() => toggleLessonExpanded(lesson.id)}
                      className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors border-b border-slate-100"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                            {lesson.batch}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/60">
                            {lesson.sessions.length} {lesson.sessions.length === 1 ? 'Session' : 'Sessions'}
                          </span>
                          <span className="text-xs text-slate-500 font-sans font-medium">
                            LKAS Certified Curriculum
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {lesson.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                          {lesson.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-slate-900 font-sans">
                            {lesson.sessions.length} Video Sessions
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Included in Syllabus
                          </p>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lesson Sessions Sub-Panel */}
                    {isExpanded && (
                      <div className="p-6 sm:p-7 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between pb-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Sessions Included in {lesson.title.split(':')[0] || 'Lesson'}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-sans font-medium">
                            Click any session to open video player
                          </span>
                        </div>

                        {lesson.sessions.length === 0 ? (
                          <div className="p-6 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                            No sessions added to this lesson yet. Admin can attach sessions from the Admin Panel.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {lesson.sessions.map((session, sIdx) => {
                              const unlocked = isSessionUnlocked(session);
                              return (
                                <div
                                  key={session.id}
                                  onClick={() => handleSessionClick(session, lesson)}
                                  className={`group p-5 rounded-2xl bg-white border transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden ${
                                    unlocked 
                                      ? 'border-slate-200/80 hover:border-blue-400 hover:shadow-lg' 
                                      : 'border-slate-200/70 bg-slate-50/50 hover:border-amber-300'
                                  }`}
                                >
                                  <div className="space-y-2">
                                    {/* Badges */}
                                    <div className="flex items-center justify-between">
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                        {session.month} Session
                                      </span>
                                      <span className="text-[10px] font-sans font-medium text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {session.duration}
                                      </span>
                                    </div>

                                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                      {session.title}
                                    </h5>

                                    {session.description && (
                                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {session.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                      {session.isFree ? (
                                        <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
                                          Free Preview
                                        </span>
                                      ) : session.youtubeUrl ? (
                                        <span className="flex items-center gap-1 text-red-600 font-semibold text-[10px]">
                                          <Play className="w-3 h-3 fill-red-600" />
                                          <span>YouTube Stream</span>
                                        </span>
                                      ) : (
                                        <span className="text-blue-600 font-semibold text-[10px]">
                                          HD Recording
                                        </span>
                                      )}
                                    </div>

                                    {unlocked ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSessionClick(session, lesson);
                                        }}
                                        className="px-3.5 py-1.5 rounded-full bg-slate-950 group-hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                                      >
                                        <Play className="w-3 h-3 fill-white" />
                                        <span>Play</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUnlockMonth(session.month, lesson);
                                        }}
                                        className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                                      >
                                        <Lock className="w-3 h-3 text-amber-700" />
                                        <span>Unlock · Rs. {lesson.price || 3500}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: MONTHLY LESSON MODULES VIEW
         ───────────────────────────────────────────────────────────── */}
      {displayMode === 'monthly' && (
        <section className="space-y-6">
          {filteredMonthlySessions.length === 0 ? (
            <div className="p-12 text-center rounded-[32px] bg-white/80 border border-slate-200/80 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No sessions found for this month</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No lesson sessions match your selected month filter. Try switching back to "All Months".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMonthlySessions.map(({ session, lesson }) => {
                const unlocked = isSessionUnlocked(session);
                return (
                  <div
                    key={session.id}
                    className="rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.06)] hover:border-blue-400 hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col justify-between"
                  >
                    {/* Top Thumbnail Banner */}
                    <div 
                      onClick={() => handleSessionClick(session, lesson)}
                      className="relative h-44 bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 p-5 flex flex-col justify-between overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-white/10 text-white backdrop-blur-md border border-white/15">
                          {session.month} Month Module
                        </span>
                        {unlocked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30">
                            1080p FHD
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>

                      <div className="relative z-10 self-center">
                        <div className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-200 shadow-xl ${
                          unlocked
                            ? 'bg-white/20 border-white/40 text-white group-hover:scale-110 group-hover:bg-blue-600'
                            : 'bg-amber-950/40 border-amber-400/40 text-amber-300 group-hover:scale-105'
                        }`}>
                          {unlocked ? (
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          ) : (
                            <Lock className="w-5 h-5 text-amber-300" />
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 font-sans">
                        <span className="font-semibold">{lesson.batch}</span>
                        <span className="px-2 py-0.5 rounded-md bg-black/40 text-white text-[11px] font-bold">
                          {session.duration}
                        </span>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-sans font-bold text-blue-600 uppercase tracking-wider block truncate max-w-[200px]">
                            {lesson.title}
                          </span>
                          <span className="text-[10px] font-sans font-semibold text-slate-400">
                            {session.month}
                          </span>
                        </div>

                        <h4 
                          onClick={() => handleSessionClick(session, lesson)}
                          className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug cursor-pointer line-clamp-2"
                        >
                          {session.title}
                        </h4>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {session.description || lesson.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-400 font-sans font-medium">
                          {session.isFree ? 'Free Preview' : (session.youtubeUrl ? 'YouTube Stream' : 'Inspire Cloud Stream')}
                        </div>

                        {unlocked ? (
                          <button
                            type="button"
                            onClick={() => handleSessionClick(session, lesson)}
                            className="py-2 px-4 rounded-full bg-slate-950 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Watch Session</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUnlockMonth(session.month, lesson)}
                            className="py-2 px-4 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Unlock Month</span>
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          CURRICULUM ASSURANCE BENTO CARD
         ───────────────────────────────────────────────────────────── */}
      <section className="p-7 sm:p-10 rounded-[32px] bg-gradient-to-r from-slate-950 via-[#0B1528] to-blue-950 text-white shadow-[0_16px_50px_rgba(15,23,42,0.14)] border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="absolute right-6 bottom-2 text-white/5 font-black text-9xl tracking-tighter select-none font-sans pointer-events-none">
          HD
        </span>

        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-wider text-blue-400 bg-blue-950/70 border border-blue-500/30 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>EXAMINATION-READY LESSON FEATURES</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Structured Lesson Modules &amp; Synchronized Monthly Replays
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-2xl">
              Engineered for methodical revision with dual-access modes designed specifically for G.C.E. Advanced Level candidates:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-blue-400 block">
                LESSON-WISE ARCHITECTURE
              </span>
              <p className="text-xs font-semibold text-white">Curriculum Progression</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Study step-by-step from foundational bookkeeping to advanced consolidated financial statements.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-400 block">
                MONTHLY COHORTS
              </span>
              <p className="text-xs font-semibold text-white">Month-by-Month Archive</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Filter by any calendar month to catch up on specific live masterclasses and revision drills.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-sky-400 block">
                SYLLABUS MATERIALS
              </span>
              <p className="text-xs font-semibold text-white">LKAS Structured Notes</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All video sessions align directly with official Department of Examinations marking schemes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Module Payment Modal for unlocking monthly fee via slip upload */}
      <ModulePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        module={selectedModuleForPay}
        currentUser={currentUser}
        onRequireLogin={onRequireLogin}
      />

    </div>
  );
};
