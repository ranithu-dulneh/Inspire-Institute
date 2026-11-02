import React, { useState, useEffect } from 'react';
import { X, Lock, Upload, Image as ImageIcon, CheckCircle, RefreshCw, AlertCircle, ShieldCheck, Globe } from 'lucide-react';
import { RankerResultItem, defaultResultsData } from './PreviousResultsSection';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeacherPhotoUpdated?: (newUrl: string | null) => void;
  onTeacherPhotoScaleUpdated?: (newScale: number) => void;
  onTeacherPhotoOffsetUpdated?: (newOffset: number) => void;
  onResultsUpdated?: (newResults: RankerResultItem[]) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onTeacherPhotoUpdated,
  onTeacherPhotoScaleUpdated,
  onTeacherPhotoOffsetUpdated,
  onResultsUpdated
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'teacher' | 'results'>('teacher');
  const [teacherPhotoUrl, setTeacherPhotoUrl] = useState<string>('');
  const [teacherPhotoSavedNotice, setTeacherPhotoSavedNotice] = useState<boolean>(false);
  const [publicSyncNotice, setPublicSyncNotice] = useState<string>('');
  const [teacherPhotoScale, setTeacherPhotoScale] = useState<number>(() => {
    const saved = localStorage.getItem('inspire_teacher_photo_scale');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [teacherPhotoOffsetY, setTeacherPhotoOffsetY] = useState<number>(() => {
    const saved = localStorage.getItem('inspire_teacher_photo_offset_y');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Results state
  const [resultsList, setResultsList] = useState<RankerResultItem[]>(() => {
    const saved = localStorage.getItem('inspire_results_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultResultsData;
      }
    }
    return defaultResultsData;
  });

  useEffect(() => {
    const saved = localStorage.getItem('inspire_teacher_photo_cutout');
    if (saved) {
      setTeacherPhotoUrl(saved);
    }
    const savedScale = localStorage.getItem('inspire_teacher_photo_scale');
    if (savedScale) {
      setTeacherPhotoScale(parseInt(savedScale, 10));
    }
    const savedOffset = localStorage.getItem('inspire_teacher_photo_offset_y');
    if (savedOffset) {
      setTeacherPhotoOffsetY(parseInt(savedOffset, 10));
    }
    // Check server configuration
    fetch('/api/teacher-photo')
      .then(res => res.json())
      .then(data => {
        if (data?.success) {
          if (data.imageUrl) setTeacherPhotoUrl(data.imageUrl);
          if (typeof data.scale === 'number') setTeacherPhotoScale(data.scale);
          if (typeof data.offsetY === 'number') setTeacherPhotoOffsetY(data.offsetY);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const broadcastAndSync = (url: string | null, scale: number, offset: number) => {
    // Notify all active tabs and public landing page in real time
    window.dispatchEvent(new CustomEvent('teacher-photo-updated', {
      detail: { imageUrl: url, scale, offsetY: offset }
    }));

    fetch('/api/teacher-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: url || null,
        scale,
        offsetY: offset
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.success) {
          setPublicSyncNotice('Published live to public site!');
          setTimeout(() => setPublicSyncNotice(''), 3000);
        }
      })
      .catch(() => {});
  };

  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(50, Math.min(200, newScale));
    setTeacherPhotoScale(clamped);
    localStorage.setItem('inspire_teacher_photo_scale', clamped.toString());
    onTeacherPhotoScaleUpdated?.(clamped);
    broadcastAndSync(teacherPhotoUrl, clamped, teacherPhotoOffsetY);
  };

  const handleOffsetChange = (newOffset: number) => {
    const clamped = Math.max(-50, Math.min(50, newOffset));
    setTeacherPhotoOffsetY(clamped);
    localStorage.setItem('inspire_teacher_photo_offset_y', clamped.toString());
    onTeacherPhotoOffsetUpdated?.(clamped);
    broadcastAndSync(teacherPhotoUrl, teacherPhotoScale, clamped);
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === 'admin' || pin === '123456' || pin === '1234' || pin === 'inspire' || pin === '2026') {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid Admin Passcode. Use 123456 or contact Lead Faculty administrator.');
    }
  };

  const handleSaveTeacherPhoto = (urlToSave: string) => {
    const trimmed = urlToSave.trim();
    if (trimmed) {
      localStorage.setItem('inspire_teacher_photo_cutout', trimmed);
      setTeacherPhotoUrl(trimmed);
      onTeacherPhotoUpdated?.(trimmed);
      broadcastAndSync(trimmed, teacherPhotoScale, teacherPhotoOffsetY);
    } else {
      localStorage.removeItem('inspire_teacher_photo_cutout');
      setTeacherPhotoUrl('');
      onTeacherPhotoUpdated?.(null);
      broadcastAndSync(null, teacherPhotoScale, teacherPhotoOffsetY);
    }

    setTeacherPhotoSavedNotice(true);
    setTimeout(() => setTeacherPhotoSavedNotice(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        handleSaveTeacherPhoto(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateResultImage = (resultId: string, imgUrl: string) => {
    const updated = resultsList.map(r => r.id === resultId ? { ...r, imageUrl: imgUrl } : r);
    setResultsList(updated);
    localStorage.setItem('inspire_results_data', JSON.stringify(updated));
    onResultsUpdated?.(updated);
  };

  const handleResultFileUpload = (resultId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        handleUpdateResultImage(resultId, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Administrator Control Console</h2>
              <p className="text-[11px] text-slate-500">Inspire Education Academic Management Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Admin Authentication Required</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Only faculty administrators can replace teacher images and configure past exam certificates.
              </p>
            </div>

            <form onSubmit={handleAuthenticate} className="max-w-xs mx-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Passcode / Admin PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter passcode (e.g. 1234 or admin)"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                />
                {pinError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Access Admin Console
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Controls */
          <div className="p-6 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab('teacher')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'teacher'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Teacher Photo &amp; Cutout
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'results'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Result Images &amp; Badges
              </button>
            </div>

            {activeTab === 'teacher' ? (
              <div className="space-y-5">
                {/* Realistic Card Preview with Blue Box and Alignment Guide */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative w-36 h-44 rounded-2xl bg-slate-100 border border-slate-200/90 overflow-hidden flex items-end justify-center shrink-0 shadow-inner">
                    {/* Blue Backdrop Card mockup matching Landing Page */}
                    <div 
                      className="absolute right-1 top-2 bottom-0 w-24 bg-gradient-to-b from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center overflow-hidden pointer-events-none"
                      aria-hidden="true"
                    >
                      <span className="text-white/20 font-black text-4xl select-none font-sans scale-110">
                        RS
                      </span>
                    </div>

                    {/* Teacher Cutout / Image flush to bottom */}
                    <div className="relative z-10 w-full h-full flex items-end justify-center">
                      {teacherPhotoUrl ? (
                        <img 
                          src={teacherPhotoUrl} 
                          alt="Preview" 
                          style={{
                            transform: `translateY(${teacherPhotoOffsetY}px) scale(${teacherPhotoScale / 100})`,
                            transformOrigin: 'bottom center'
                          }}
                          className="w-full h-full object-contain object-bottom drop-shadow-md transition-transform duration-150" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-end pb-2">
                          <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="text-[10px] text-slate-400 font-medium">Default Artwork</span>
                        </div>
                      )}
                    </div>

                    {/* Flush Bottom Baseline Indicator (confirms 0 space between photo and blue box) */}
                    <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500 z-20 pointer-events-none" />
                  </div>

                  <div className="space-y-2 text-xs min-w-0 flex-1 w-full">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-sm">Lead Faculty Portrait Display</p>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>Public Site Active</span>
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      {teacherPhotoUrl 
                        ? 'Your uploaded photo is active across the public landing page hero and student portals.' 
                        : 'Currently using the high-fidelity vector studio portrait on the public site.'}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] font-semibold border border-blue-200">
                        Scale: {teacherPhotoScale}%
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
                        Offset: {teacherPhotoOffsetY > 0 ? `+${teacherPhotoOffsetY}` : teacherPhotoOffsetY}px
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Baseline: Flush with blue box (0 space)</span>
                      </span>
                    </div>

                    {(teacherPhotoSavedNotice || publicSyncNotice) && (
                      <p className="text-emerald-700 font-semibold flex items-center gap-1 pt-1 text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{publicSyncNotice || 'Changes published live to public site!'}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile Picture Size Editor Control */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-900 block">
                        Profile Picture Size &amp; Scale
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Adjust size to scale the teacher portrait larger or smaller
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleScaleChange(teacherPhotoScale - 5)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                        title="Decrease Size (-5%)"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          min="50"
                          max="200"
                          value={teacherPhotoScale}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) handleScaleChange(val);
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScaleChange(teacherPhotoScale + 5)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                        title="Increase Size (+5%)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min="50"
                      max="180"
                      step="1"
                      value={teacherPhotoScale}
                      onChange={(e) => handleScaleChange(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    
                    {/* Quick Presets */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      {[
                        { label: 'Compact', scale: 80 },
                        { label: 'Default', scale: 100 },
                        { label: 'Large', scale: 115 },
                        { label: 'Heroic', scale: 130 },
                        { label: 'Maximum', scale: 150 }
                      ].map((preset) => (
                        <button
                          key={preset.scale}
                          type="button"
                          onClick={() => handleScaleChange(preset.scale)}
                          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            teacherPhotoScale === preset.scale
                              ? 'bg-blue-600 text-white font-bold shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {preset.label} ({preset.scale}%)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Alignment & Y-Shift (Eliminates space between picture and blue box) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-900 block">
                        Vertical Alignment &amp; Bottom Edge
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Nudge the image down to keep it flush against the blue box with no empty gap
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOffsetChange(teacherPhotoOffsetY - 2)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        title="Shift Up"
                      >
                        ▲ Up
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOffsetChange(teacherPhotoOffsetY + 2)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        title="Shift Down"
                      >
                        ▼ Down
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOffsetChange(0)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors"
                      >
                        Snap Flush (0px)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      step="1"
                      value={teacherPhotoOffsetY}
                      onChange={(e) => handleOffsetChange(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>-40px (Higher)</span>
                      <span className="font-bold text-slate-700">Current Shift: {teacherPhotoOffsetY}px</span>
                      <span>+40px (Lower)</span>
                    </div>
                  </div>
                </div>

                {/* Upload or URL form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Upload New Teacher Photo Cutout (.png, .jpg, .webp)
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <p className="text-xs font-medium text-slate-700">Click to upload photo file</p>
                        <p className="text-[10px] text-slate-400">Transparent PNG cutout recommended</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="flex-shrink mx-4 text-[10px] text-slate-400 uppercase font-bold">Or enter Image URL</span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={teacherPhotoUrl}
                      onChange={(e) => setTeacherPhotoUrl(e.target.value)}
                      placeholder="https://example.com/teacher-cutout.png"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSaveTeacherPhoto(teacherPhotoUrl)}
                      className="px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
                    >
                      Save URL
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleSaveTeacherPhoto('')}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset to Original Default</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Results Images Tab */
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                <p className="text-xs text-slate-500">
                  Configure student achievement images displayed in the Previous Results Bento grid:
                </p>

                {resultsList.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          {item.rankTitle} · {item.year}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{item.studentName}</h4>
                      </div>
                      {item.imageUrl && (
                        <span className="text-[10px] text-emerald-600 font-semibold">Image Configured</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.imageUrl || ''}
                        onChange={(e) => handleUpdateResultImage(item.id, e.target.value)}
                        placeholder="Image URL or upload below..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <label className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer shrink-0 transition-colors">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleResultFileUpload(item.id, e)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
