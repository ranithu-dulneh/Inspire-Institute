import React, { useState } from 'react';
import { 
  X, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Calendar, 
  Clock, 
  Play, 
  Link as LinkIcon, 
  Info,
  BookOpen
} from 'lucide-react';
import { LessonModule } from '../types';
import { lessonService, MONTH_LIST } from '../services/lessonService';

interface YouTubeUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: LessonModule[];
  onUploadSuccess?: (newSession: any) => void;
}

export const YouTubeUploaderModal: React.FC<YouTubeUploaderModalProps> = ({
  isOpen,
  onClose,
  lessons,
  onUploadSuccess
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(() => lessons[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('August');
  const [duration, setDuration] = useState<string>('1h 45m');
  const [isFree, setIsFree] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSession, setCompletedSession] = useState<{
    title: string;
    youtubeUrl: string;
    youtubeId: string;
    lessonTitle: string;
    month: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen) return null;

  // Extract 11-char YouTube ID from any standard or shortened URL
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentYouTubeId = extractYouTubeId(youtubeUrl.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = youtubeUrl.trim();
    const extractedId = extractYouTubeId(trimmedUrl);

    if (!trimmedUrl || !extractedId) {
      setErrorMessage('Please enter a valid YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...).');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please enter a lecture title.');
      return;
    }

    if (!selectedLessonId) {
      setErrorMessage('Please select a target lesson module.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const standardUrl = `https://www.youtube.com/watch?v=${extractedId}`;
      const targetLesson = lessons.find(l => l.id === selectedLessonId);

      const createdSession = await lessonService.addSessionToLesson({
        lessonId: selectedLessonId,
        title: title.trim(),
        month: selectedMonth,
        youtubeUrl: standardUrl,
        duration: duration.trim() || '1h 45m',
        isFree: isFree,
        description: description.trim() || `Official syllabus lecture session for ${selectedMonth}.`
      });

      // Broadcast update event so all LMS dashboards sync live
      window.dispatchEvent(new CustomEvent('inspire-lessons-updated'));

      setCompletedSession({
        title: title.trim(),
        youtubeUrl: standardUrl,
        youtubeId: extractedId,
        lessonTitle: targetLesson?.title || 'Selected Module',
        month: selectedMonth
      });

      if (onUploadSuccess) {
        onUploadSuccess(createdSession);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to attach YouTube lecture to syllabus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!completedSession) return;
    navigator.clipboard.writeText(completedSession.youtubeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const resetForm = () => {
    setYoutubeUrl('');
    setTitle('');
    setDescription('');
    setCompletedSession(null);
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50/60 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Add YouTube Lecture Session</span>
              </h3>
              <p className="text-xs text-slate-500">
                Attach an unlisted YouTube video lecture to any lesson module
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left">
          
          {/* Quick Guidance Note */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Upload your lecture to your channel (<span className="font-semibold text-slate-900">inspireinstitute.lms@gmail.com</span>) in <a href="https://studio.youtube.com" target="_blank" rel="noreferrer" className="underline font-bold text-blue-600 hover:text-blue-800">YouTube Studio</a> as <strong>Unlisted</strong>, then paste the link below. The LMS will secure playback for paid students.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {completedSession ? (
            /* Success State */
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-xl font-black text-slate-950 tracking-tight">
                  Lecture Session Attached!
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">{completedSession.title}</strong> has been added to <strong className="text-slate-900">{completedSession.lessonTitle}</strong> for the {completedSession.month} cohort.
                </p>
              </div>

              {/* YouTube Link Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-lg mx-auto text-left space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Verified YouTube URL</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ID: {completedSession.youtubeId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={completedSession.youtubeUrl}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={completedSession.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Test on YouTube</span>
                </a>

                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Add Another Lecture
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Done &amp; View in LMS
                </button>
              </div>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* YouTube Link Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  YouTube Video Link <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Live Thumbnail Preview if valid ID detected */}
              {currentYouTubeId && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <img
                    src={`https://img.youtube.com/vi/${currentYouTubeId}/hqdefault.jpg`}
                    alt="YouTube Preview"
                    className="w-24 h-14 rounded-lg object-cover border border-slate-300 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Valid YouTube Video Detected
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      ID: {currentYouTubeId}
                    </p>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Lecture Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Partnership Dissolution & Realization Account Masterclass"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Module and Month Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Attach to Lesson Module</label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs focus:outline-none"
                  >
                    {lessons.map(les => (
                      <option key={les.id} value={les.id}>
                        {les.title} ({les.batch})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Syllabus Cohort Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs focus:outline-none"
                  >
                    {MONTH_LIST.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration and Free Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Lecture Duration</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 1h 45m"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-xs focus:outline-none"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="freePreview"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="freePreview" className="text-[11px] text-slate-700 font-semibold cursor-pointer">
                      Free Preview (Accessible without fee)
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Description &amp; Syllabus Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive syllabus overview, chapter guidelines, and exercise references..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !youtubeUrl.trim() || !title.trim()}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Video className="w-4 h-4 fill-white" />
                  <span>{isSubmitting ? 'Attaching...' : 'Attach YouTube Video to LMS'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
