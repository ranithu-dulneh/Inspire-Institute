import React, { useState } from 'react';
import { PastPaper } from '../types';
import { resolveR2Url } from '../lib/supabase';
import { 
  X, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Share2, 
  Bookmark 
} from 'lucide-react';

interface PdfReaderModalProps {
  paper: PastPaper | null;
  onClose: () => void;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({ paper, onClose }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'paper' | 'scheme'>('paper');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  if (!paper) return null;

  const totalPages = activeTab === 'paper' ? paper.pages : Math.max(12, Math.floor(paper.pages * 0.75));
  const realPdfUrl = paper.fileUrl || (paper.filePath ? resolveR2Url(paper.filePath) : null);

  const handleDownload = () => {
    setDownloadSuccess(true);
    if (realPdfUrl) {
      const link = document.createElement('a');
      link.href = realPdfUrl;
      link.download = `${paper.subject.replace(/\s+/g, '_')}_${paper.year}_${paper.medium}.pdf`;
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-5xl h-[94vh] max-h-[900px] bg-white/95 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Apple Liquid Glass Header) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4 border-b border-slate-200/80 bg-white/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200/50">
                  {paper.year} Examination
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  {paper.medium} Medium
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {paper.title}
              </h3>
            </div>
          </div>

          {/* Segmented Document Toggle (Paper vs Scheme) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              onClick={() => {
                setActiveTab('paper');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'paper'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Question Paper
            </button>
            <button
              onClick={() => {
                setActiveTab('scheme');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'scheme'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Marking Scheme
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              title={isBookmarked ? 'Bookmarked' : 'Bookmark this paper'}
              className={`p-2 rounded-xl border transition-colors ${
                isBookmarked 
                  ? 'bg-amber-50 border-amber-200 text-amber-600' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white apple-button-primary rounded-xl transition-all"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Close document viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Navigation & Zoom Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 border-b border-slate-200/60 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-md hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="tabular-nums font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-md hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => setZoomLevel(z => Math.max(75, z - 15))}
                className="p-0.5 hover:text-slate-950 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-sans tabular-nums">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(z => Math.min(150, z + 15))}
                className="p-0.5 hover:text-slate-950 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-500 font-sans text-[11px]">
              Size: {paper.fileSize}
            </span>
          </div>
        </div>

        {/* Main Document Canvas */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-100/70 flex justify-center">
          {realPdfUrl ? (
            <iframe 
              src={realPdfUrl} 
              title={paper.title} 
              className="w-full max-w-4xl h-full min-h-[700px] rounded-xl border border-slate-200/90 shadow-xl bg-white" 
            />
          ) : (
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-[760px] min-h-[920px] bg-white p-8 md:p-12 shadow-xl rounded-xl border border-slate-200/90 transition-transform duration-150 text-slate-900"
            >
            {/* Examination Header Stamp */}
            <div className="border-b-2 border-slate-900 pb-6 mb-6 text-center">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-1">
                DEPARTMENT OF EXAMINATIONS, SRI LANKA
              </div>
              <div className="text-sm md:text-base font-bold text-slate-950 tracking-tight">
                General Certificate of Education (Adv. Level) Examination - {paper.year}
              </div>
              <div className="text-xs font-semibold text-blue-900 mt-1 uppercase tracking-wide">
                {paper.subject} · {paper.medium.toUpperCase()} MEDIUM · {activeTab === 'paper' ? 'PAPER I & II' : 'OFFICIAL MARKING CRITERIA'}
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600 mt-4 pt-3 border-t border-slate-200">
                <span>Three Hours</span>
                <span className="font-sans font-semibold">INDEX NO: _______________________</span>
                <span>Additional Reading Time: 10 min</span>
              </div>
            </div>

            {/* Simulated Realistic Document Body */}
            {activeTab === 'paper' ? (
              <div className="space-y-6 text-sm text-slate-800 leading-relaxed font-serif">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans text-slate-600">
                  <span className="font-semibold text-slate-900">Instructions:</span> Answer all questions in Part A and any four questions from Part B. Write your working steps clearly. Calculators are non-programmable.
                </div>

                <div className="space-y-3">
                  <h4 className="font-sans font-bold text-slate-900 text-sm">
                    PART A — Structured Conceptual Questions ({paper.subject})
                  </h4>

                  <div className="border-l-2 border-blue-500 pl-4 py-1 text-slate-800">
                    <p className="font-bold text-xs uppercase tracking-wider text-slate-500 font-sans mb-1">
                      Question 01: LKAS Framework Application
                    </p>
                    <p>
                      Explain the principle of <em>Prudence</em> as defined in the Sri Lanka Accounting Standards (LKAS). Under what circumstances should potential liabilities be recognized as provisions rather than disclosed as contingent liabilities? Provide two concrete balance-sheet examples.
                    </p>
                    <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs font-sans space-y-2">
                      <div className="flex justify-between text-slate-500">
                        <span>(a) Definition & Qualitative Characteristics</span>
                        <span className="font-sans">[05 Marks]</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>(b) Criteria for Present Obligation from Past Events</span>
                        <span className="font-sans">[05 Marks]</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-2 border-slate-300 pl-4 py-1 text-slate-800">
                    <p className="font-bold text-xs uppercase tracking-wider text-slate-500 font-sans mb-1">
                      Question 02: Partnership Capital & Goodwill Adjustments
                    </p>
                    <p>
                      A and B were partners sharing profits and losses in the ratio of 3:2. On 01.04.{paper.year - 1}, they admitted C into the partnership for a 1/5th share of profits. The goodwill of the firm was revalued at Rs. 600,000. Detail the journal entries required when:
                    </p>
                    <ol className="list-decimal list-inside mt-2 text-xs text-slate-700 space-y-1 font-sans">
                      <li>Goodwill is raised and retained in the books.</li>
                      <li>Goodwill is adjusted solely through the partners' capital accounts without opening a goodwill account.</li>
                    </ol>
                  </div>

                  <div className="border-l-2 border-slate-300 pl-4 py-1 text-slate-800">
                    <p className="font-bold text-xs uppercase tracking-wider text-slate-500 font-sans mb-1">
                      Question 03: Cash Flow Statement Mechanics (LKAS 7)
                    </p>
                    <p>
                      During the financial year ended 31.03.{paper.year}, Apex Holdings PLC reported an operating profit before tax of Rs. 4,850,000. Depreciation charged for the period was Rs. 920,000 and gain on disposal of factory equipment was Rs. 140,000. Working capital changes included an increase in inventories of Rs. 380,000 and an increase in trade payables of Rs. 210,000.
                    </p>
                    <p className="mt-2 text-xs font-sans text-slate-600">
                      <strong>Required:</strong> Calculate the Net Cash Generated from Operating Activities using the indirect method.
                    </p>
                  </div>
                </div>

                {/* Footer Page Number */}
                <div className="pt-8 mt-12 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-sans">
                  <span>Inspire Institution · Archive Document #{paper.id.toUpperCase()}</span>
                  <span className="font-sans font-medium text-slate-600">Page {currentPage} of {totalPages}</span>
                  <span>Confidential Examination Material</span>
                </div>
              </div>
            ) : (
              /* Marking Scheme View */
              <div className="space-y-6 text-sm text-slate-800 leading-relaxed font-sans">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Official Marking Scheme:</strong> Evaluated according to national chief examiners standards with breakdown of step-wise marks and alternate solution methods.
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 font-semibold text-xs text-slate-900 border-b border-slate-200 flex justify-between">
                      <span>Question 01 Scoring Rubric</span>
                      <span className="text-emerald-700 font-bold">Total: 10 Marks</span>
                    </div>
                    <div className="p-4 space-y-3 text-xs">
                      <div className="flex justify-between items-start gap-4 pb-2 border-b border-slate-100">
                        <div>
                          <p className="font-semibold text-slate-900">Definition of Prudence:</p>
                          <p className="text-slate-600">Inclusion of a degree of caution in the exercise of judgements needed in making estimates under conditions of uncertainty.</p>
                        </div>
                        <span className="font-sans text-blue-600 font-semibold shrink-0">03 Marks</span>
                      </div>
                      <div className="flex justify-between items-start gap-4 pb-2 border-b border-slate-100">
                        <div>
                          <p className="font-semibold text-slate-900">Provision vs Contingency Criteria:</p>
                          <p className="text-slate-600">Present legal/constructive obligation + Probable outflow (&gt;50%) + Reliable estimate possible.</p>
                        </div>
                        <span className="font-sans text-blue-600 font-semibold shrink-0">04 Marks</span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">Two Valid Examples:</p>
                          <p className="text-slate-600">Warranties obligation provision (1.5 marks), Pending litigation with probable settlement (1.5 marks).</p>
                        </div>
                        <span className="font-sans text-blue-600 font-semibold shrink-0">03 Marks</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 font-semibold text-xs text-slate-900 border-b border-slate-200 flex justify-between">
                      <span>Question 03 Cash Flow Solution</span>
                      <span className="text-emerald-700 font-bold">Total: 10 Marks</span>
                    </div>
                    <div className="p-4 text-xs font-sans bg-slate-50 space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Operating Profit Before Tax</span>
                        <span>4,850,000</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>+ Depreciation Expense</span>
                        <span>+ 920,000 (02 Marks)</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>- Gain on Disposal of Equipment</span>
                        <span>- 140,000 (02 Marks)</span>
                      </div>
                      <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                        <span>Operating Profit Before Working Capital</span>
                        <span>5,630,000 (01 Mark)</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>- Increase in Inventories</span>
                        <span>- 380,000 (02 Marks)</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>+ Increase in Trade Payables</span>
                        <span>+ 210,000 (02 Marks)</span>
                      </div>
                      <div className="flex justify-between font-bold text-blue-700 pt-2 border-t-2 border-slate-400">
                        <span>Net Cash from Operating Activities</span>
                        <span>Rs. 5,460,000 (01 Mark)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-12 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-sans">
                  <span>Inspire Institution · Marking Guide Standardized 2026</span>
                  <span className="font-sans font-medium text-slate-600">Page {currentPage} of {totalPages}</span>
                  <span>Chief Examiner Approved</span>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
