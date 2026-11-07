import React, { useState, useEffect } from 'react';
import { CategorizedMaterial } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ExternalLink, 
  DollarSign, 
  Tag, 
  Layers, 
  Calendar,
  AlertCircle,
  Cloud,
  Database,
  HardDrive
} from 'lucide-react';
import { BATCH_LIST, MONTH_LIST } from '../../services/lessonService';

interface MaterialUploadsTabProps {
  materials: CategorizedMaterial[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const MaterialUploadsTab: React.FC<MaterialUploadsTabProps> = ({
  materials,
  onRefresh,
  showToast
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tute' | 'past_paper' | 'marking_scheme'>('all');
  
  // Storage connectivity state
  const [storageStatus, setStorageStatus] = useState<{
    cloudflareConfigured: boolean;
    storageType: string;
    publicBase: string;
    bucketName: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/storage-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStorageStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  // New material form state
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<'tute' | 'past_paper' | 'marking_scheme'>('tute');
  const [batch, setBatch] = useState<string>('A/L 2025');
  const [month, setMonth] = useState<string>('August');
  const [isFree, setIsFree] = useState<boolean>(true);
  const [price, setPrice] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFileUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a descriptive material title.');
      return;
    }
    if (!fileUrl.trim()) {
      setErrorMessage('Please upload a PDF document or enter a direct file URL.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      let resolvedFileUrl = fileUrl.trim();
      let calculatedFileSize = '3.5 MB';

      // If user selected a local file, upload to Cloudflare R2 / Server storage first
      if (fileUrl.startsWith('data:')) {
        const resp = await fetch('/api/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: fileUrl,
            fileName: fileName || `${title.trim()}.pdf`,
            category,
            batch,
            month,
            title: title.trim(),
            isFree,
            price: isFree ? 0 : Number(price || 0)
          })
        });

        if (!resp.ok) {
          const errJson = await resp.json().catch(() => ({}));
          throw new Error(errJson.error || `Failed to upload document to storage (${resp.status})`);
        }

        const uploadData = await resp.json();
        if (uploadData.success && (uploadData.url || uploadData.material?.fileUrl)) {
          resolvedFileUrl = uploadData.url || uploadData.material.fileUrl;
          calculatedFileSize = uploadData.material?.fileSize || calculatedFileSize;
        }
      }

      await supabaseService.uploadCategorizedMaterial({
        title: title.trim(),
        category,
        batch,
        month,
        isFree,
        price: isFree ? 0 : Number(price || 0),
        fileUrl: resolvedFileUrl,
        fileSize: calculatedFileSize
      });

      showToast(`Material "${title.trim()}" published successfully!`);
      setTitle('');
      setFileUrl('');
      setFileName('');
      setIsFree(true);
      setPrice(0);
      onRefresh();
    } catch (err: any) {
      console.error('Material upload error:', err);
      setErrorMessage(err?.message || 'Failed to upload material.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    try {
      await supabaseService.deleteCategorizedMaterial(id);
      showToast(`Material "${itemTitle}" removed from digital library`);
      onRefresh();
    } catch {
      showToast('Could not remove material');
    }
  };

  const filteredList = materials.filter(m => {
    if (categoryFilter === 'all') return true;
    return m.category === categoryFilter;
  });

  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Curriculum Material Uploads &amp; Categorization
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload and classify student study materials as Tutes, Past Papers, or Marking Schemes with free or paid access pricing.
          </p>
        </div>

        {/* Live Storage Indicator Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 bg-slate-50 border-slate-200 text-slate-700">
          {storageStatus?.cloudflareConfigured ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span>Cloudflare R2 Storage</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <HardDrive className="w-3.5 h-3.5 text-slate-600" />
              <span>Server Storage Active</span>
            </>
          )}
        </div>
      </div>

      {/* Upload New Material Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Upload className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Upload New Material</h3>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitUpload} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Title */}
            <div className="md:col-span-8 space-y-1.5">
              <label className="font-bold text-slate-700 block">Material Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 2024 Accounting Theory Structured Revision Tute"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            {/* Category Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="font-bold text-slate-700 block">Material Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-semibold text-slate-800"
              >
                <option value="tute">Class Tute</option>
                <option value="past_paper">Past Paper</option>
                <option value="marking_scheme">Marking Scheme</option>
              </select>
            </div>

            {/* Batch */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="font-bold text-slate-700 block">Target Cohort Batch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
              >
                {BATCH_LIST.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="font-bold text-slate-700 block">Syllabus Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
              >
                {MONTH_LIST.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Free or Paid Toggle */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="font-bold text-slate-700 block">Access Model</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setIsFree(true); setPrice(0); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isFree ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Free Access
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    !isFree ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paid Access
                </button>
              </div>
            </div>

            {/* Amount input if Paid */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Price (LKR)
              </label>
              <input
                type="number"
                disabled={isFree}
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)}
                placeholder={isFree ? 'Free (Rs. 0)' : 'e.g. 750'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 font-mono tabular-nums"
              />
            </div>

            {/* File dropzone / URL */}
            <div className="md:col-span-12 space-y-2">
              <label className="font-bold text-slate-700 block">
                Attach PDF or Material Document
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-colors block bg-slate-50/50">
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleFileDrop}
                    className="hidden"
                  />
                  <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <span className="font-bold text-slate-800 block text-xs">
                    {fileName ? fileName : 'Click to select PDF from computer'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Direct local PDF file
                  </span>
                </label>

                <div className="flex flex-col justify-center space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">Or provide direct Cloud URL:</span>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://.../document.pdf"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading & Publishing...' : 'Publish Material to Library'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Materials Table */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Materials ({materials.length})
            </button>
            <button
              onClick={() => setCategoryFilter('tute')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === 'tute' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tutes ({materials.filter(m => m.category === 'tute').length})
            </button>
            <button
              onClick={() => setCategoryFilter('past_paper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === 'past_paper' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past Papers ({materials.filter(m => m.category === 'past_paper').length})
            </button>
            <button
              onClick={() => setCategoryFilter('marking_scheme')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === 'marking_scheme' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Marking Schemes ({materials.filter(m => m.category === 'marking_scheme').length})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Cohort</th>
                  <th className="py-3.5 px-4">Month</th>
                  <th className="py-3.5 px-4">Pricing</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No materials found in this category</p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">{item.title}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{item.fileSize || 'PDF'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.category === 'tute' && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200/60">
                            Class Tute
                          </span>
                        )}
                        {item.category === 'past_paper' && (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-200/60">
                            Past Paper
                          </span>
                        )}
                        {item.category === 'marking_scheme' && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/60">
                            Marking Scheme
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">{item.batch}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{item.month}</td>

                      <td className="py-3.5 px-4">
                        {item.isFree ? (
                          <span className="text-emerald-700 font-bold text-[11px]">Free</span>
                        ) : (
                          <span className="text-slate-900 font-bold font-sans tabular-nums text-[11px]">
                            Rs. {item.price.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="View Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
