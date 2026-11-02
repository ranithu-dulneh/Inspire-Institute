import React, { useState } from 'react';
import { LiveClass } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { 
  Video, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Radio, 
  X,
  AlertCircle
} from 'lucide-react';
import { BATCH_LIST, MONTH_LIST } from '../../services/lessonService';

interface LiveClassesSchedulerProps {
  liveClasses: LiveClass[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const LiveClassesScheduler: React.FC<LiveClassesSchedulerProps> = ({
  liveClasses,
  onRefresh,
  showToast
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [title, setTitle] = useState<string>('');
  const [batch, setBatch] = useState<string>('A/L 2025');
  const [month, setMonth] = useState<string>('September');
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [zoomLink, setZoomLink] = useState<string>('https://zoom.us/j/');
  const [zoomPasscode, setZoomPasscode] = useState<string>('INSPIRE');
  const [agenda, setAgenda] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !zoomLink.trim()) {
      setErrorMessage('Please fill in class title and Zoom meeting link.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await supabaseService.createLiveClass({
        title: title.trim(),
        batch,
        month,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes || 120),
        zoomLink: zoomLink.trim(),
        zoomPasscode: zoomPasscode.trim() || undefined,
        agenda: agenda.trim() || undefined,
        isFree: false,
        status: 'upcoming'
      });

      showToast(`Scheduled live masterclass "${title.trim()}" successfully!`);
      setShowModal(false);
      setTitle('');
      setAgenda('');
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to schedule live class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, classTitle: string) => {
    try {
      await supabaseService.deleteLiveClass(id);
      showToast(`Live class "${classTitle}" deleted`);
      onRefresh();
    } catch {
      showToast('Could not delete live class session');
    }
  };

  return (
    <div className="space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Scheduled Live Classes &amp; Zoom Lectures</h3>
          <p className="text-xs text-slate-500">
            Set up real-time live video lectures. Links are automatically revealed to students with approved monthly fees.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Live Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveClasses.map(c => {
          const classDate = new Date(c.scheduledAt);
          return (
            <div key={c.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <span className="font-bold text-slate-900">{c.batch}</span>
                    <span aria-hidden="true">·</span>
                    <span>{c.month}</span>
                    <span aria-hidden="true">·</span>
                    <span>{c.durationMinutes}m</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Zoom Live
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {c.title}
                </h4>

                <div className="flex items-center gap-3 text-xs text-slate-600 font-sans font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{classDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{classDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {c.agenda && (
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {c.agenda}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div className="text-[11px] font-sans text-slate-500 truncate max-w-[200px]">
                  Pass: <strong className="text-slate-800">{c.zoomPasscode || 'None'}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={c.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-blue-700 hover:bg-slate-100 flex items-center gap-1"
                    title="Test Meeting Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete Class"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Live Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schedule New Live Zoom Class</h3>
                <p className="text-xs text-slate-500">Provide meeting credentials and syllabus agenda</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Class Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. LKAS 02 Inventory Valuation & Group Consolidation Masterclass"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Batch</label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {BATCH_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {MONTH_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Scheduled Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 120)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Zoom Link</label>
                  <input
                    type="url"
                    required
                    value={zoomLink}
                    onChange={(e) => setZoomLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-sans text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Passcode</label>
                  <input
                    type="text"
                    value={zoomPasscode}
                    onChange={(e) => setZoomPasscode(e.target.value)}
                    placeholder="e.g. INSPIRE2025"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-sans font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Agenda / Session Topics</label>
                <textarea
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Outline topics covered in this masterclass..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
