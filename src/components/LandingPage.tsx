import React, { useState, useEffect, useMemo } from 'react';
import { ActiveTab, WallOfFameRanker, CurrentUser, PastPaper } from '../types';
import { TeacherPortraitCutout } from './TeacherPortraitCutout';
import { TypewriterText } from './TypewriterText';
import { PreviousResultsSection, RankerResultItem } from './PreviousResultsSection';
import { ScrollReveal } from './ScrollReveal';
import { supabaseService } from '../services/supabaseService';
import { 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  BookOpen, 
  Scale, 
  Zap, 
  Video, 
  ChevronRight, 
  Sparkles, 
  Play,
  Search,
  Check,
  Download,
  GraduationCap,
  LayoutDashboard
} from 'lucide-react';

interface LandingPageProps {
  currentUser?: CurrentUser | null;
  onNavigate: (tab: ActiveTab) => void;
  onOpenEnrollment: () => void;
  onOpenLogin: () => void;
  onSelectPaper?: (paper: PastPaper) => void;
  onSelectRanker: (ranker: WallOfFameRanker) => void;
  teacherImageUrl?: string;
  teacherImageScale?: number;
  teacherImageOffsetY?: number;
  resultsData?: RankerResultItem[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onNavigate,
  onOpenEnrollment,
  onOpenLogin,
  onSelectPaper,
  onSelectRanker,
  teacherImageUrl,
  teacherImageScale,
  teacherImageOffsetY,
  resultsData
}) => {
  const [homePaperSearch, setHomePaperSearch] = useState<string>('');
  const [paperMediumFilter, setPaperMediumFilter] = useState<string>('all');
  const [allPapers, setAllPapers] = useState<PastPaper[]>([]);

  useEffect(() => {
    supabaseService.getPastPapers().then(setAllPapers).catch(() => {});
    const handleUpdate = () => {
      supabaseService.getPastPapers().then(setAllPapers).catch(() => {});
    };
    window.addEventListener('inspire-papers-updated', handleUpdate);
    return () => window.removeEventListener('inspire-papers-updated', handleUpdate);
  }, []);

  const filteredHomePapers = useMemo(() => {
    let list = allPapers;
    if (paperMediumFilter === 'Marking') {
      list = list.filter(p => p.hasMarkingScheme || p.title.toLowerCase().includes('marking'));
    } else if (paperMediumFilter !== 'all') {
      list = list.filter(p => p.medium.toLowerCase() === paperMediumFilter.toLowerCase());
    }

    if (!homePaperSearch.trim()) return list.slice(0, 6);
    const q = homePaperSearch.toLowerCase().trim();
    return list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.year.toString().includes(q) ||
      p.medium.toLowerCase().includes(q) ||
      p.subject.toLowerCase().includes(q) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [allPapers, homePaperSearch, paperMediumFilter]);

  const handleDownloadPaper = (e: React.MouseEvent, paper: PastPaper) => {
    e.stopPropagation();
    const fileUrl = paper.fileUrl || supabaseService.resolveR2Url(paper.filePath);
    if (fileUrl) {
      const element = document.createElement('a');
      element.href = fileUrl;
      element.download = `${paper.title.replace(/\s+/g, '_')}.pdf`;
      element.target = '_blank';
      element.rel = 'noreferrer';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };
  return (
    <div className="space-y-28 md:space-y-36 pb-32 text-left">
      
      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION: Clean, spacious, animated with Real Teacher Cutout
          and varied typography (No techy fonts, generous whitespace)
         ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-6 sm:pt-14 pb-12 sm:pb-16 overflow-hidden">
        
        {/* Soft Ambient Radial Background Glow */}
        <div className="absolute top-1/4 left-1/4 w-[550px] h-[450px] bg-blue-200/20 rounded-full blur-[130px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-sky-200/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 items-center">
          
          {/* Left Column: Teacher Cutout (Significantly bigger on desktop, prominently visible on mobile & tablet) */}
          <div className="md:col-span-5 lg:col-span-6 flex justify-center order-2 md:order-1 relative w-full">
            <ScrollReveal direction="up" delay={120} duration={850}>
              <TeacherPortraitCutout 
                customImageUrl={teacherImageUrl} 
                customImageScale={teacherImageScale}
                customImageOffsetY={teacherImageOffsetY}
              />
            </ScrollReveal>
          </div>

          {/* Right Column: Scaled down automatically on mobile & tablet to fit neatly on screen */}
          <div className="md:col-span-7 lg:col-span-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-7 order-1 md:order-2">
            
            {/* Title with Varied Text Styles & Typewriter Animation */}
            <ScrollReveal direction="up" delay={180}>
              <div className="space-y-1 sm:space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
                    MEET THE LEAD FACULTY
                  </span>
                </div>

                <h1 className="font-black text-slate-950 tracking-tight leading-[1.2]">
                  <span className="block text-slate-900 font-extrabold text-sm sm:text-base md:text-xl lg:text-3xl">
                    Under a Single Lead Faculty
                  </span>

                  <span className="inline-block mt-0.5 sm:mt-1 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 bg-clip-text text-transparent font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight">
                    Producing the Highest{' '}
                    <TypewriterText 
                      words={['University Entrants', 'Accounting A Passes', 'Island Ranks']} 
                      className="underline decoration-amber-400 decoration-3 sm:decoration-4"
                    />
                    {' '}in Sri Lanka
                  </span>
                  
                  <span className="block text-slate-800 font-bold text-xs sm:text-sm md:text-base lg:text-2xl mt-0.5 sm:mt-1">
                    In a Single Academic Year
                  </span>

                  <span className="block text-emerald-700 font-black text-xs sm:text-sm md:text-base lg:text-2xl mt-0.5 sm:mt-1">
                    Reserve Your Seat in the #1 Accounting Class...
                  </span>
                </h1>
              </div>
            </ScrollReveal>

            {/* Hero CTAs */}
            <ScrollReveal direction="up" delay={260}>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 md:gap-4 pt-2 sm:pt-3">
                {currentUser ? (
                  <>
                    <button
                      onClick={() => onNavigate(currentUser.role === 'Admin' ? 'admin' : 'lms')}
                      className="px-5 py-2.5 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-xs sm:text-sm md:text-base font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-full flex items-center gap-2.5 shadow-lg shadow-slate-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {currentUser.role === 'Admin' ? (
                        <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      ) : (
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      )}
                      <span>{currentUser.role === 'Admin' ? 'Access Admin Console' : 'Go to My LMS Dashboard'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const el = document.getElementById('past-papers-search');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-4 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full flex items-center gap-2 shadow-xs hover:shadow-md transition-all"
                    >
                      <Search className="w-4 h-4 text-blue-600" />
                      <span>Search Past Papers</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const el = document.getElementById('classes');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3.5 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full flex items-center gap-2 sm:gap-3 shadow-xs hover:shadow-md transition-all group hover:scale-[1.02]"
                    >
                      <span className="tracking-wide">COURSES</span>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-2xs">
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 -rotate-45" />
                      </div>
                    </button>

                    <button
                      onClick={onOpenEnrollment}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-7 md:py-3.5 text-xs sm:text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Register Now</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <button
                      onClick={onOpenLogin}
                      className="px-3.5 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3.5 text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all shadow-xs"
                    >
                      Student Login
                    </button>
                  </>
                )}
              </div>
            </ScrollReveal>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: CLASSES & PROGRAMS (Screenshot 2026-10-07 at 00.11.55.png)
          Clean text hierarchy, generous whitespace, structured programs
         ───────────────────────────────────────────────────────────── */}
      <section id="classes" className="space-y-8">
        
        {/* Header row */}
        <ScrollReveal direction="up" delay={50}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                CLASSES &amp; PROGRAMS
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
                Structured Academic Programs &amp; Masterclasses at Inspire Education
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500 lg:text-right shrink-0">
              03 structured programs designed for A/L Accounting excellence
            </span>
          </div>
        </ScrollReveal>

        {/* 3 Balanced Academic Program Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Theory Class */}
          <ScrollReveal direction="up" delay={120}>
            <div 
              onClick={onOpenLogin}
              className="h-full p-8 rounded-[32px] bg-slate-950 text-white flex flex-col justify-between space-y-8 relative overflow-hidden group cursor-pointer border border-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/80 to-blue-950/30" />
              
              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-400">01</span>
                  <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold tracking-tight text-white">
                  Theory Class
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Systematic masterclasses covering foundational concepts and the entire national syllabus with crystal clarity.
                </p>
              </div>

              <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                  CORE
                </span>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white flex items-center gap-1 transition-colors">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: Revision Classes */}
          <ScrollReveal direction="up" delay={200}>
            <div 
              onClick={onOpenLogin}
              className="h-full p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-md flex flex-col justify-between space-y-8 group cursor-pointer hover:border-slate-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-400">02</span>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold tracking-tight text-slate-950">
                  Revision Classes
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Targeted review sessions reinforcing core exam topics, proven working methodologies, and examination techniques.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">
                  REVISION
                </span>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <span>Explore Schedule</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3: Paper Classes */}
          <ScrollReveal direction="up" delay={280}>
            <div 
              onClick={onOpenLogin}
              className="h-full p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-md flex flex-col justify-between space-y-8 group cursor-pointer hover:border-slate-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-400">03</span>
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold tracking-tight text-slate-950">
                  Paper Classes
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Weekly timed paper discussions, official marking scheme walkthroughs, and exam time-management mastery.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-indigo-600 font-bold">
                  EVALUATION
                </span>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <span>View Papers</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: LARGE PAST EXAMINATION PAPERS SEARCH & ARCHIVE DISCOVERY
          High-visibility search bar, instant medium filters & direct PDF download
         ───────────────────────────────────────────────────────────── */}
      <section id="past-papers-search" className="space-y-8">
        <ScrollReveal direction="up" delay={50}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                OFFICIAL G.C.E. A/L ARCHIVES
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950">
                Search Past Examination Papers &amp; Marking Schemes
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Quickly locate official Sri Lankan Accounting examination papers, full marking schemes, and point-allocation guides across all examination years.
              </p>
            </div>
            <button
              onClick={() => onNavigate('past-papers')}
              className="px-5 py-2.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-colors self-start md:self-auto shrink-0 shadow-2xs"
            >
              <span>View Full Archives</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </ScrollReveal>

        {/* Large Prominent Search & Filter Control Bar */}
        <ScrollReveal direction="up" delay={120}>
          <div className="p-4 sm:p-6 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-lg space-y-4">
            
            {/* Search Input Bar (Extra Wide & Prominent) */}
            <div className="relative">
              <Search className="w-6 h-6 text-slate-400 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={homePaperSearch}
                onChange={(e) => setHomePaperSearch(e.target.value)}
                placeholder="Search by year (e.g. 2024, 2023), medium (Sinhala/English), Paper I/II or topic..."
                className="w-full pl-13 sm:pl-15 pr-20 sm:pr-24 py-3.5 sm:py-4 text-sm sm:text-base rounded-2xl bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 text-slate-900 transition-all font-sans placeholder:text-slate-400"
              />
              {homePaperSearch ? (
                <button 
                  onClick={() => setHomePaperSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Clear
                </button>
              ) : (
                <span className="hidden sm:inline-block absolute right-4 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-mono font-medium text-slate-400 border border-slate-200">
                  Search
                </span>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-semibold text-slate-400 mr-1">Filter:</span>
                {[
                  { id: 'all', label: 'All Mediums' },
                  { id: 'Sinhala', label: 'Sinhala Medium' },
                  { id: 'English', label: 'English Medium' },
                  { id: 'Tamil', label: 'Tamil Medium' },
                  { id: 'Marking', label: 'Marking Schemes Only' }
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setPaperMediumFilter(chip.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      paperMediumFilter === chip.id
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <span className="text-xs font-medium text-slate-500">
                Found <strong className="text-slate-900">{filteredHomePapers.length}</strong> matching papers
              </span>
            </div>

          </div>
        </ScrollReveal>

        {/* Paper Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredHomePapers.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No examination papers found matching &quot;{homePaperSearch}&quot;</p>
              <button
                onClick={() => {
                  setHomePaperSearch('');
                  setPaperMediumFilter('all');
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredHomePapers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => {
                  if (onSelectPaper) {
                    onSelectPaper(paper);
                  }
                  onNavigate('past-papers');
                }}
                className="p-5 sm:p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-100">
                      {paper.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {paper.medium}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950 text-base group-hover:text-blue-700 transition-colors line-clamp-2">
                      {paper.title}
                    </h3>
                    {paper.subtitle && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {paper.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
                    <span>Open Paper</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  <button
                    onClick={(e) => handleDownloadPaper(e, paper)}
                    title="Download Paper PDF"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: PREVIOUS RESULTS SECTION (Screenshot 2026-10-07 at 00.00.40.png)
         ───────────────────────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={80}>
        <PreviousResultsSection
          results={resultsData}
          onViewFullRegister={() => onNavigate('results')}
          onWatchHighlight={(item) => {
            onSelectRanker({
              id: item.id,
              rank: item.rankTitle.includes('1') ? 1 : 5,
              name: item.studentName,
              achievement: `${item.rankTitle} - A/L Commerce`,
              year: 2025,
              school: item.school || 'Maliyadeva Balika',
              district: 'Kurunegala',
              zScore: '2.8410',
              quote: 'Unrivalled guidance under Mrs. Ruwanthi Senanayaka.',
              videoDuration: '3:45 min'
            });
          }}
        />
      </ScrollReveal>

    </div>
  );
};
