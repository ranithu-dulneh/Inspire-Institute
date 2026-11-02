import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertCircle,
  Radio,
  Sparkles,
  Users,
  Copy,
  Check
} from 'lucide-react';
import { LiveClass, CurrentUser } from '../types';
import { supabaseService } from '../services/supabaseService';
import { ModulePaymentModal, UnlockedModule } from './ModulePaymentModal';

interface LiveClassesViewProps {
  currentUser: CurrentUser | null;
  onRequireLogin: () => void;
}

export const LiveClassesView: React.FC<LiveClassesViewProps> = ({
  currentUser,
  onRequireLogin
}) => {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [unlockedMonths, setUnlockedMonths] = useState<Record<string, boolean>>({});
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [copiedPasscodeId, setCopiedPasscodeId] = useState<string | null>(null);
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedModuleForPay, setSelectedModuleForPay] = useState<UnlockedModule | null>(null);

  const fetchClassesAndAccess = async () => {
    const classes = await supabaseService.getLiveClasses();
    setLiveClasses(classes);

    if (currentUser) {
      if (currentUser.role === 'Admin') {
        const adminAccess: Record<string, boolean> = {};
        classes.forEach(c => { adminAccess[c.month.toLowerCase()] = true; });
        setUnlockedMonths(adminAccess);
      } else {
        const accessMap: Record<string, boolean> = {};
        for (const c of classes) {
          const isUnlocked = await supabaseService.isMonthUnlockedForStudent(currentUser.id, c.month);
          accessMap[c.month.toLowerCase()] = isUnlocked;
        }
        setUnlockedMonths(accessMap);
      }
    } else {
      setUnlockedMonths({});
    }
  };

  useEffect(() => {
    fetchClassesAndAccess();

    const handleUpdate = () => {
      fetchClassesAndAccess();
    };

    window.addEventListener('inspire-live-classes-updated', handleUpdate);
    window.addEventListener('inspire-monthly-access-updated', handleUpdate);
    window.addEventListener('inspire-slips-updated', handleUpdate);

    return () => {
      window.removeEventListener('inspire-live-classes-updated', handleUpdate);
      window.removeEventListener('inspire-monthly-access-updated', handleUpdate);
      window.removeEventListener('inspire-slips-updated', handleUpdate);
    };
  }, [currentUser]);

  const handleCopyPasscode = (id: string, passcode?: string) => {
    if (!passcode) return;
    navigator.clipboard.writeText(passcode);
    setCopiedPasscodeId(id);
    setTimeout(() => setCopiedPasscodeId(null), 2000);
  };

  const handleUnlockClick = (c: LiveClass) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setSelectedModuleForPay({
      id: `live-mod-${c.id}`,
      batch: c.batch,
      title: `${c.month} Curriculum & Live Masterclass`,
      month: c.month,
      priceLKR: 3500,
      description: `Includes full access to ${c.title}, weekly recorded video modules, discussion papers, and Zoom interactive Q&A.`,
      isUnlocked: false
    });
    setPaymentModalOpen(true);
  };

  const filteredClasses = liveClasses.filter(c => {
    if (selectedBatch === 'All') return true;
    return c.batch.toLowerCase().includes(selectedBatch.toLowerCase());
  });

  return (
    <div className="space-y-10 sm:space-y-12 pb-24 text-left">
      
      {/* Hero Header */}
      <section className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="text-blue-700 font-bold uppercase tracking-wider">
            Live Interactive Hub
          </span>
          <span aria-hidden="true">·</span>
          <span>Zoom Theory &amp; Paper Masterclasses</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-[1.15]">
          Scheduled Live Classes &amp;{' '}
          <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 bg-clip-text text-transparent">
            Interactive Sessions
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Join real-time Zoom lectures with live structured question discussions, LKAS deep-dives, and real-time student Q&amp;A. Verified access is granted to enrolled students upon monthly fee approval.
        </p>

        {/* Batch Filter Bar */}
        <div className="pt-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 mr-1">Batch:</span>
          {['All', 'A/L 2025', 'A/L 2026', 'A/L 2027'].map(batch => (
            <button
              key={batch}
              onClick={() => setSelectedBatch(batch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedBatch === batch
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {batch}
            </button>
          ))}
        </div>
      </section>

      {/* Class Schedule Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClasses.map((item) => {
          const isUnlocked = Boolean(unlockedMonths[item.month.toLowerCase()]);
          const classDate = new Date(item.scheduledAt);
          const isToday = new Date().toDateString() === classDate.toDateString();
          const isPast = new Date() > new Date(classDate.getTime() + item.durationMinutes * 60000);

          return (
            <div
              key={item.id}
              className={`relative rounded-3xl border transition-all p-6 sm:p-7 space-y-5 bg-white shadow-sm flex flex-col justify-between ${
                isUnlocked 
                  ? 'border-blue-200/90 hover:border-blue-400' 
                  : 'border-slate-200/80 bg-slate-50/50'
              }`}
            >
              <div className="space-y-4">
                {/* Meta row */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <span className="font-bold text-slate-900">{item.batch}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.month} Cohort</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.durationMinutes} Minutes</span>
                  </div>

                  {isPast ? (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Concluded
                    </span>
                  ) : isToday ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                      Scheduled Today
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-blue-700">
                      Upcoming
                    </span>
                  )}
                </div>

                {/* Class Title */}
                <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                  {item.title}
                </h3>

                {/* Schedule details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      {classDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-mono tabular-nums">
                      {classDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} (SL Time)
                    </span>
                  </div>
                </div>

                {/* Agenda text */}
                {item.agenda && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">Syllabus Agenda: </span>
                    {item.agenda}
                  </p>
                )}
              </div>

              {/* Action / Join / Lock state */}
              <div className="pt-3 border-t border-slate-100">
                {isUnlocked ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60">
                      <div className="flex items-center gap-1.5">
                        <Unlock className="w-4 h-4 text-emerald-600" />
                        <span>Monthly Fee Verified · Full Access Granted</span>
                      </div>
                      {item.zoomPasscode && (
                        <button
                          type="button"
                          onClick={() => handleCopyPasscode(item.id, item.zoomPasscode)}
                          className="flex items-center gap-1 text-[11px] font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                        >
                          {copiedPasscodeId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Pass: {item.zoomPasscode}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <a
                      href={item.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live Zoom Masterclass</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60">
                      <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Locked · {item.month} Monthly Fee Verification Required</span>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        Rs. 3,500
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnlockClick(item)}
                      className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Upload Bank Slip or Class Card to Unlock</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredClasses.length === 0 && (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No scheduled live classes for this cohort</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upcoming Zoom masterclasses and revisions will appear here once scheduled by the instructor.
          </p>
        </div>
      )}

      {/* Module Payment Modal for Live Class unlocking */}
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
