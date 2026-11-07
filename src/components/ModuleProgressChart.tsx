import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { LessonModule, CurrentUser } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Trophy, 
  TrendingUp, 
  PlayCircle, 
  Clock, 
  BarChart3, 
  PieChart as PieIcon, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface ModuleProgressChartProps {
  currentUser: CurrentUser;
  lessons: LessonModule[];
  onSelectSession?: (sessionId: string, lessonId: string) => void;
}

interface ModuleProgressData {
  id: string;
  name: string;
  shortName: string;
  totalSessions: number;
  completedSessions: number;
  percentage: number;
  batch: string;
  sessions: {
    id: string;
    title: string;
    duration: string;
    isCompleted: boolean;
  }[];
}

export const ModuleProgressChart: React.FC<ModuleProgressChartProps> = ({
  currentUser,
  lessons,
  onSelectSession
}) => {
  const [viewType, setViewType] = useState<'bars' | 'dial'>('bars');
  const [showChecklist, setShowChecklist] = useState<boolean>(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // Storage key for user session completion
  const storageKey = `inspire_user_progress_${currentUser.id || 'default'}`;

  // State mapping completed session IDs: { [sessionId]: boolean }
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}

    // Default completion if first time (e.g. mark first 2 sessions completed)
    const initial: Record<string, boolean> = {};
    if (lessons.length > 0 && lessons[0].sessions?.length > 0) {
      initial[lessons[0].sessions[0].id] = true;
      if (lessons[0].sessions[1]) {
        initial[lessons[0].sessions[1].id] = true;
      }
    }
    return initial;
  });

  const toggleSessionComplete = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedMap(prev => {
      const next = { ...prev, [sessionId]: !prev[sessionId] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      window.dispatchEvent(new CustomEvent('inspire-progress-updated', { detail: next }));
      return next;
    });
  };

  useEffect(() => {
    const handleProgressUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, boolean>>;
      if (customEvent.detail) {
        setCompletedMap(customEvent.detail);
      }
    };
    window.addEventListener('inspire-progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('inspire-progress-updated', handleProgressUpdate);
  }, []);

  // Compute progress data per lesson module
  const progressData: ModuleProgressData[] = useMemo(() => {
    return lessons.map((les) => {
      const sessions = les.sessions || [];
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => Boolean(completedMap[s.id])).length;
      const percentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
      const shortName = les.title.length > 16 ? `${les.title.slice(0, 14)}..` : les.title;

      return {
        id: les.id,
        name: les.title,
        shortName,
        totalSessions,
        completedSessions,
        percentage,
        batch: les.batch || 'A/L 2026',
        sessions: sessions.map(s => ({
          id: s.id,
          title: s.title,
          duration: s.duration || '1h 30m',
          isCompleted: Boolean(completedMap[s.id])
        }))
      };
    });
  }, [lessons, completedMap]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalSessions = progressData.reduce((acc, m) => acc + m.totalSessions, 0);
    const completedSessions = progressData.reduce((acc, m) => acc + m.completedSessions, 0);
    const overallPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const completedModules = progressData.filter(m => m.percentage === 100 && m.totalSessions > 0).length;
    const inProgressModules = progressData.filter(m => m.percentage > 0 && m.percentage < 100).length;
    const hoursCompleted = (completedSessions * 1.75).toFixed(1);

    return {
      totalSessions,
      completedSessions,
      overallPercentage,
      completedModules,
      inProgressModules,
      totalModules: progressData.length,
      hoursCompleted
    };
  }, [progressData]);

  // Dynamic bar colors based on progress percentage
  const getBarColor = (percentage: number) => {
    if (percentage === 100) return '#10b981'; // Emerald
    if (percentage >= 50) return '#3b82f6';  // Blue
    if (percentage > 0) return '#f59e0b';   // Amber
    return '#cbd5e1';                       // Slate-300
  };

  // Pie chart data for Overall Dial
  const pieData = useMemo(() => {
    const completed = stats.completedSessions;
    const remaining = Math.max(0, stats.totalSessions - completed);
    return [
      { name: 'Completed Sessions', value: completed, fill: '#10b981' },
      { name: 'Remaining Sessions', value: remaining || 1, fill: '#f1f5f9' }
    ];
  }, [stats]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4 text-left">
      
      {/* Contracted Header with Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <span>Syllabus Mastery</span>
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              · Tracked in real-time
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Module Completion Progress
          </h3>
        </div>

        {/* View Mode Toggle: Sleek Module Bars vs Compact Dial */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewType('bars')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewType === 'bars'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Modules</span>
          </button>

          <button
            type="button"
            onClick={() => setViewType('dial')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewType === 'dial'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dial</span>
          </button>
        </div>
      </div>

      {/* Contracted 1-Row KPI Ribbon (Takes minimal height, never overflows) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase block">Progress</span>
            <span className="text-lg font-extrabold text-slate-900 leading-none">{stats.overallPercentage}%</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            %
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Mastered</span>
            <span className="text-lg font-extrabold text-slate-900 leading-none">{stats.completedModules} <span className="text-xs font-semibold text-slate-400">/ {stats.totalModules}</span></span>
          </div>
          <Trophy className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Lectures Done</span>
            <span className="text-lg font-extrabold text-slate-900 leading-none">{stats.completedSessions} <span className="text-xs font-semibold text-slate-400">/ {stats.totalSessions}</span></span>
          </div>
          <Clock className="w-5 h-5 text-amber-600" />
        </div>

        <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase block">Study Time</span>
            <span className="text-lg font-extrabold text-slate-900 leading-none">{stats.hoursCompleted} <span className="text-xs font-semibold text-slate-400">hrs</span></span>
          </div>
          <BookOpen className="w-5 h-5 text-purple-600" />
        </div>
      </div>

      {/* Contracted Clean Visualization Area (No smudged labels) */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
        {progressData.length === 0 ? (
          <div className="py-6 text-center text-slate-400 space-y-1">
            <Clock className="w-6 h-6 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No syllabus units registered yet</p>
          </div>
        ) : viewType === 'bars' ? (
          /* Clean Horizontal Module Progress List (Never smudges, zero overlapping text) */
          <div className="space-y-2.5">
            {progressData.map((module) => (
              <div 
                key={module.id} 
                onClick={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
                className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-900 truncate">
                      {module.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      ({module.completedSessions}/{module.totalSessions} sessions)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span 
                      className={`text-[11px] font-extrabold px-2 py-0.2 rounded-md ${
                        module.percentage === 100 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : module.percentage >= 50 
                          ? 'bg-blue-100 text-blue-800' 
                          : module.percentage > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {module.percentage}%
                    </span>
                    {expandedModuleId === module.id ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Clean Horizontal Bar Track */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${module.percentage}%`,
                      backgroundColor: getBarColor(module.percentage)
                    }}
                  />
                </div>

                {/* Inline Checklist Expansion on Click */}
                {expandedModuleId === module.id && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    {module.sessions.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No lecture sessions attached to this unit.</p>
                    ) : (
                      module.sessions.map((session, sIdx) => (
                        <div 
                          key={session.id}
                          onClick={() => toggleSessionComplete(session.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {session.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 hover:text-blue-500 shrink-0" />
                            )}
                            <span className={`text-xs truncate ${session.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                              {sIdx + 1}. {session.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400 font-mono">{session.duration}</span>
                            {onSelectSession && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectSession(session.id, module.id);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-blue-600"
                                title="Play video"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Micro Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[10px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>100% Completed</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>50% - 99% In Progress</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>1% - 49% Started</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>Not Started</span>
              </span>
            </div>
          </div>
        ) : (
          /* Compact Dial (Takes only ~150px height) */
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="relative w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 font-sans">{stats.overallPercentage}%</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Done</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900">Overall Course Pace</p>
              <p className="text-slate-600 text-[11px] leading-snug">
                Completed <strong className="text-slate-900">{stats.completedSessions}</strong> of <strong className="text-slate-900">{stats.totalSessions}</strong> lectures across {stats.totalModules} modules.
              </p>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                <span>{stats.overallPercentage >= 80 ? 'Ready for past paper drills!' : 'Steady revision pace'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Full Checklist Button */}
      <div className="pt-0.5 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setShowChecklist(!showChecklist)}
          className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{showChecklist ? 'Hide Full Syllabus Checklist' : 'Show Full Syllabus Checklist'}</span>
          {showChecklist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <span className="text-[11px] text-slate-400">
          Click any lecture above to toggle done
        </span>
      </div>

      {/* Collapsible Full Syllabus Checklist Section */}
      {showChecklist && (
        <div className="pt-2 border-t border-slate-100 space-y-2 animate-fade-in">
          {progressData.map((module) => (
            <div key={module.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{module.name}</span>
                <span className="text-[11px] font-mono text-slate-500">{module.percentage}%</span>
              </div>

              <div className="space-y-1">
                {module.sessions.map((session, idx) => (
                  <div
                    key={session.id}
                    onClick={() => toggleSessionComplete(session.id)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200/60 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/60"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {session.isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                      <span className={`text-[11px] truncate ${session.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {idx + 1}. {session.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{session.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
