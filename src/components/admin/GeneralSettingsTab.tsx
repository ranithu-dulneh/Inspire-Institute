import React, { useState, useEffect, useRef } from 'react';
import { GeneralSettings } from '../../types';
import { DbInstitution } from '../../lib/supabase';
import { supabaseService } from '../../services/supabaseService';
import { RankerResultItem } from '../PreviousResultsSection';
import { 
  Building2, 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Image as ImageIcon, 
  MapPin, 
  ToggleLeft, 
  ToggleRight,
  ShieldCheck,
  AlertCircle,
  Upload,
  FileImage,
  X,
  Check,
  RotateCcw,
  Cloud,
  HardDrive
} from 'lucide-react';

interface GeneralSettingsTabProps {
  currentPhotoUrl: string;
  currentScale: number;
  currentOffset: number;
  onSavePhotoUrl: (url: string) => void;
  onScaleChange: (scale: number) => void;
  onOffsetChange: (offset: number) => void;
  resultsData: RankerResultItem[];
  onUpdateResultItem: (index: number, updated: RankerResultItem) => void;
  onResetResultsToDefault: () => void;
  showToast: (msg: string) => void;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  currentPhotoUrl,
  currentScale,
  currentOffset,
  onSavePhotoUrl,
  onScaleChange,
  onOffsetChange,
  resultsData,
  onUpdateResultItem,
  onResetResultsToDefault,
  showToast
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'bank' | 'institutes' | 'faculty' | 'results'>('bank');
  
  // Bank Settings
  const [bankSettings, setBankSettings] = useState<GeneralSettings>({
    bankName: 'Commercial Bank of Ceylon',
    accountName: 'Inspire Academy of Accounting',
    accountNumber: '8001234567',
    branchName: 'Nugegoda City Branch',
    paymentInstructions: 'Please include your Student ID as the reference when making bank transfers.',
    contactWhatsApp: '+94 77 123 4567'
  });
  const [isSavingBank, setIsSavingBank] = useState<boolean>(false);

  // Institutes Settings
  const [institutes, setInstitutes] = useState<DbInstitution[]>([]);
  const [newInstName, setNewInstName] = useState<string>('');
  const [newInstLocation, setNewInstLocation] = useState<string>('');
  const [isAddingInst, setIsAddingInst] = useState<boolean>(false);

  // Photo Uploader & URL state
  const [photoUrlInput, setPhotoUrlInput] = useState<string>(currentPhotoUrl);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isSavingCover, setIsSavingCover] = useState<boolean>(false);
  const [showManualUrl, setShowManualUrl] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live storage status
  const [storageStatus, setStorageStatus] = useState<{
    cloudflareConfigured: boolean;
    storageType: string;
    publicBase: string;
    bucketName: string;
  } | null>(null);

  useEffect(() => {
    supabaseService.getGeneralSettings().then(setBankSettings).catch(() => {});
    supabaseService.getInstitutions().then(setInstitutes).catch(() => {});
    fetch('/api/storage-status')
      .then(res => res.json())
      .then(d => { if (d.success) setStorageStatus(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPhotoUrlInput(currentPhotoUrl);
  }, [currentPhotoUrl]);

  const handleProcessImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsProcessingFile(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const isPng = file.type === 'image/png';
            const optimized = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9);
            setPhotoUrlInput(optimized);
            setUploadedFileName(file.name);
            setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
            setIsProcessingFile(false);
            showToast(`Loaded ${file.name}. Click "Save & Publish" to upload to storage.`);
            return;
          }
        }

        setPhotoUrlInput(dataUrl);
        setUploadedFileName(file.name);
        setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        setIsProcessingFile(false);
        showToast(`Loaded ${file.name}. Click "Save & Publish" to upload to storage.`);
      };

      img.onerror = () => {
        setIsProcessingFile(false);
        showToast('Could not load image file.');
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setIsProcessingFile(false);
      showToast('Could not read image file.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleResetToDefault = () => {
    setPhotoUrlInput('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    onSavePhotoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Reverted to default faculty cutout.');
  };

  const handleSaveCoverPhoto = async () => {
    if (!photoUrlInput) {
      handleResetToDefault();
      return;
    }

    setIsSavingCover(true);
    try {
      if (photoUrlInput.startsWith('data:image/')) {
        const resp = await fetch('/api/upload-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: photoUrlInput,
            scale: currentScale,
            offsetY: currentOffset
          })
        });

        if (!resp.ok) {
          throw new Error('Upload to storage failed');
        }

        const data = await resp.json();
        if (data.success && data.url) {
          setPhotoUrlInput(data.url);
          onSavePhotoUrl(data.url);
          showToast(data.message || 'Cover photo uploaded to storage and published live!');
          return;
        }
      }

      onSavePhotoUrl(photoUrlInput);
      showToast('Cover photo saved and published live to homepage!');
    } catch (err) {
      console.error('Error saving cover photo to storage:', err);
      onSavePhotoUrl(photoUrlInput);
      showToast('Photo published to homepage.');
    } finally {
      setIsSavingCover(false);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    try {
      await supabaseService.updateGeneralSettings(bankSettings);
      showToast('Teacher bank details updated and live across payment dialogs');
    } catch {
      showToast('Failed to update bank settings.');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleAddInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim()) return;
    setIsAddingInst(true);
    try {
      const added = await supabaseService.addInstitution(newInstName, newInstLocation);
      setInstitutes(prev => [...prev, added]);
      setNewInstName('');
      setNewInstLocation('');
      showToast(`Added institute "${added.name}" to registration centers`);
    } catch {
      showToast('Failed to add institute.');
    } finally {
      setIsAddingInst(false);
    }
  };

  const handleToggleInst = async (id: string, currentActive: boolean) => {
    const next = !currentActive;
    await supabaseService.toggleInstitutionActive(id, next);
    setInstitutes(prev => prev.map(i => i.id === id ? { ...i, is_active: next } : i));
    showToast(`Institute status updated`);
  };

  const handleDeleteInst = async (id: string, name: string) => {
    try {
      await supabaseService.deleteInstitution(id);
      setInstitutes(prev => prev.filter(i => i.id !== id));
      showToast(`Institute "${name}" removed`);
    } catch {
      showToast('Could not remove institute');
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          General Settings &amp; Academy Configuration
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure teacher bank details, registration centers, faculty branding, and student rankers.
        </p>
      </div>

      {/* Sub-nav tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-max">
        <button
          onClick={() => setActiveSubSection('bank')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeSubSection === 'bank' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Teacher Bank Details</span>
        </button>

        <button
          onClick={() => setActiveSubSection('institutes')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeSubSection === 'institutes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Registration Institutes ({institutes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubSection('faculty')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeSubSection === 'faculty' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span>Faculty Cover &amp; Portrait Photo</span>
        </button>

        <button
          onClick={() => setActiveSubSection('results')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeSubSection === 'results' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Exam Rankers</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: TEACHER & ACADEMY BANK DETAILS
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'bank' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Teacher &amp; Academy Bank Account Details</h3>
            <p className="text-xs text-slate-500">
              These details are displayed directly to students inside the fee payment dialog when making bank deposits.
            </p>
          </div>

          <form onSubmit={handleSaveBankDetails} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankSettings.bankName}
                  onChange={(e) => setBankSettings({ ...bankSettings, bankName: e.target.value })}
                  placeholder="e.g. Commercial Bank of Ceylon"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Branch Name</label>
                <input
                  type="text"
                  required
                  value={bankSettings.branchName}
                  onChange={(e) => setBankSettings({ ...bankSettings, branchName: e.target.value })}
                  placeholder="e.g. Nugegoda City Branch"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={bankSettings.accountName}
                  onChange={(e) => setBankSettings({ ...bankSettings, accountName: e.target.value })}
                  placeholder="e.g. Inspire Academy of Accounting"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Account Number</label>
                <input
                  type="text"
                  required
                  value={bankSettings.accountNumber}
                  onChange={(e) => setBankSettings({ ...bankSettings, accountNumber: e.target.value })}
                  placeholder="e.g. 8001234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans font-bold tracking-wider text-blue-700"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-700 block">Special Payment Instructions for Students</label>
                <textarea
                  rows={3}
                  value={bankSettings.paymentInstructions}
                  onChange={(e) => setBankSettings({ ...bankSettings, paymentInstructions: e.target.value })}
                  placeholder="Please specify your Student ID as the reference..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs resize-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-700 block">Support WhatsApp Helpline</label>
                <input
                  type="text"
                  value={bankSettings.contactWhatsApp}
                  onChange={(e) => setBankSettings({ ...bankSettings, contactWhatsApp: e.target.value })}
                  placeholder="+94 77 123 4567"
                  className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs"
                />
              </div>

            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSavingBank}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingBank ? 'Saving Details...' : 'Save Bank Details'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: REGISTRATION INSTITUTES
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'institutes' && (
        <div className="space-y-6">
          {/* Add institute form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Add New Registration Institute / Center</h3>
            </div>

            <form onSubmit={handleAddInstitute} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-end">
              <div className="sm:col-span-6 space-y-1">
                <label className="font-bold text-slate-700">Institute Name</label>
                <input
                  type="text"
                  required
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  placeholder="e.g. Rotary Hall - Nugegoda"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="font-bold text-slate-700">Location / City (Optional)</label>
                <input
                  type="text"
                  value={newInstLocation}
                  onChange={(e) => setNewInstLocation(e.target.value)}
                  placeholder="e.g. Nugegoda, Colombo"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isAddingInst}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Institute</span>
                </button>
              </div>
            </form>
          </div>

          {/* Institutes list table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Center / Institute Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No institutes registered yet.
                    </td>
                  </tr>
                ) : (
                  institutes.map(inst => (
                    <tr key={inst.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{inst.name}</td>
                      <td className="py-3 px-4 text-slate-600">{inst.location || 'All Centers'}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleInst(inst.id, inst.is_active)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            inst.is_active 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {inst.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteInst(inst.id, inst.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: FACULTY COVER / PORTRAIT PHOTO (DIRECT FILE UPLOADER)
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'faculty' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faculty Cover &amp; Lead Teacher Portrait</h3>
              <p className="text-xs text-slate-500">
                Upload a transparent PNG cutout or photo of the lead faculty. Changes sync live across the homepage hero banner.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Storage Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shrink-0 bg-slate-50 border-slate-200 text-slate-700">
                {storageStatus?.cloudflareConfigured ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Cloud className="w-3 h-3 text-blue-600" />
                    <span>Cloudflare R2</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <HardDrive className="w-3 h-3 text-slate-600" />
                    <span>Server Storage</span>
                  </>
                )}
              </div>

              {photoUrlInput && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="self-start sm:self-auto text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Visual Live Preview Box (Matches Homepage Hero Presentation) */}
            <div className="lg:col-span-5 flex flex-col items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Live Homepage Card Preview
              </span>

              <div className="relative w-56 h-76 rounded-3xl bg-slate-100 border-2 border-slate-300/80 overflow-hidden flex items-end justify-center shadow-lg">
                <div className="absolute right-3 top-3 bottom-0 w-36 bg-gradient-to-b from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center pointer-events-none">
                  <span className="text-white/20 font-black text-6xl font-sans">RS</span>
                </div>

                <div className="relative z-10 w-full h-full flex items-end justify-center pointer-events-none">
                  {photoUrlInput ? (
                    <img
                      src={photoUrlInput}
                      alt="Faculty preview"
                      style={{
                        transform: `translateY(${currentOffset}px) scale(${currentScale / 100})`,
                        transformOrigin: 'bottom center'
                      }}
                      className="w-full h-full object-contain object-bottom drop-shadow-md transition-transform duration-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                      <span className="text-xs text-slate-500 font-semibold">Using Default Cutout</span>
                      <span className="text-[10px] text-slate-400 mt-1">Upload a custom image to replace</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-2.5 left-2.5 z-20">
                  {photoUrlInput ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                      <Check className="w-3 h-3" />
                      <span>Custom Image</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-white shadow-xs">
                      Default Preset
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500 z-20 pointer-events-none" />
              </div>

              <p className="text-[11px] text-slate-400 text-center max-w-xs">
                Real-time alignment against the blue hero card. Use the calibration sliders below to fine-tune.
              </p>
            </div>

            {/* Direct File Uploader & Controls */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Direct Drag & Drop / File Picker Area */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 text-xs block">
                  Direct Cover Image Upload
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessImageFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 sm:p-7 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/70 shadow-md scale-[1.01]'
                      : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
                    {isProcessingFile ? (
                      <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      Click to choose file or drag &amp; drop your image here
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports transparent PNG cutout, JPG, or WEBP (Max 25MB)
                    </p>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 pointer-events-none"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Browse Image from Device</span>
                  </button>
                </div>

                {/* Uploaded File Info Bar */}
                {uploadedFileName && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">{uploadedFileName}</span>
                      {uploadedFileSize && (
                        <span className="text-[11px] text-emerald-700 font-sans font-medium">({uploadedFileSize})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFileName(null);
                        setUploadedFileSize(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isSavingCover || isProcessingFile}
                  onClick={handleSaveCoverPhoto}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSavingCover ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading to Storage...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save &amp; Publish Photo to Homepage</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualUrl(!showManualUrl)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {showManualUrl ? 'Hide URL Input' : 'Or Paste Image URL'}
                </button>
              </div>

              {/* Collapsible Manual URL Input */}
              {showManualUrl && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 animate-in fade-in">
                  <label className="font-bold text-slate-700 text-xs block">Hosted Direct Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="https://example.com/teacher-cutout.png"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                    />
                    <button
                      type="button"
                      disabled={isSavingCover}
                      onClick={handleSaveCoverPhoto}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Apply &amp; Save
                    </button>
                  </div>
                </div>
              )}

              {/* Calibration Sliders */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900">Portrait Alignment &amp; Scale Calibration</h4>
                  <p className="text-[11px] text-slate-500">Fine-tune the size and vertical position to flush cleanly against the card bottom.</p>
                </div>

                {/* Scale Slider */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Portrait Scale</span>
                    <span className="font-sans font-bold text-blue-700 tabular-nums">{currentScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    step="1"
                    value={currentScale}
                    onChange={(e) => onScaleChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                    <span>50% (Smaller)</span>
                    <span>100% (Default)</span>
                    <span>180% (Larger)</span>
                  </div>
                </div>

                {/* Vertical Offset Slider */}
                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Vertical Flush Baseline Shift</span>
                    <span className="font-sans font-bold text-emerald-700 tabular-nums">{currentOffset}px</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="1"
                    value={currentOffset}
                    onChange={(e) => onOffsetChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                    <span>-40px (Shift Down)</span>
                    <span>0px (Flush)</span>
                    <span>+40px (Shift Up)</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: EXAM RANKERS & WALL OF FAME
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'results' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">National Exam Rankers &amp; Wall of Fame</h3>
              <p className="text-xs text-slate-500">Edit student achievement cards on the homepage.</p>
            </div>
            <button
              type="button"
              onClick={onResetResultsToDefault}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultsData.map((res, idx) => (
              <div key={res.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                    {res.rankTitle} ({res.year})
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {res.indexNo}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Student Name</label>
                    <input
                      type="text"
                      value={res.studentName}
                      onChange={(e) => onUpdateResultItem(idx, { ...res, studentName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Index Number</label>
                      <input
                        type="text"
                        value={res.indexNo}
                        onChange={(e) => onUpdateResultItem(idx, { ...res, indexNo: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-0.5">School</label>
                      <input
                        type="text"
                        value={res.school || ''}
                        onChange={(e) => onUpdateResultItem(idx, { ...res, school: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
