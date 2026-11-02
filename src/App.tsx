import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  PastPaper, 
  VideoModule, 
  StudyMaterial, 
  CartItem, 
  CurrentUser, 
  WallOfFameRanker 
} from './types';
import { lessonService, sessionToVideoModule } from './services/lessonService';
import { InspireLogo } from './components/InspireLogo';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LandingPage } from './components/LandingPage';
import { LMSDashboard } from './components/LMSDashboard';
import { PastPapersView } from './components/PastPapersView';
import { VideoModulesView } from './components/VideoModulesView';
import { StudyMaterialsStore } from './components/StudyMaterialsStore';
import { StudentLoginPortal } from './components/StudentLoginPortal';
import { InstitutionSelectModal, Institution } from './components/InstitutionSelectModal';
import { ResultsView } from './components/ResultsView';
import { LiveClassesView } from './components/LiveClassesView';
import { PdfReaderModal } from './components/PdfReaderModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { WallOfFameModal } from './components/WallOfFameModal';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { EnrollmentModal } from './components/EnrollmentModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminDashboard } from './components/AdminDashboard';
import { RankerResultItem, defaultResultsData } from './components/PreviousResultsSection';
import { supabaseService } from './services/supabaseService';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  // Default to null so public visitors do NOT see Papers and Videos before logging in
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Search items strictly from real database & R2 storage
  const [searchPapers, setSearchPapers] = useState<PastPaper[]>([]);
  const [searchVideos, setSearchVideos] = useState<VideoModule[]>([]);
  const [searchMaterials, setSearchMaterials] = useState<StudyMaterial[]>([]);

  // Modals state
  const [institutionSelectOpen, setInstitutionSelectOpen] = useState<boolean>(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoModule | null>(null);
  const [selectedRanker, setSelectedRanker] = useState<WallOfFameRanker | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState<boolean>(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState<boolean>(false);
  const [teacherPhotoUrl, setTeacherPhotoUrl] = useState<string | null>(() => {
    return localStorage.getItem('inspire_teacher_photo_cutout');
  });
  const [teacherPhotoScale, setTeacherPhotoScale] = useState<number>(() => {
    const saved = localStorage.getItem('inspire_teacher_photo_scale');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [teacherPhotoOffsetY, setTeacherPhotoOffsetY] = useState<number>(() => {
    const saved = localStorage.getItem('inspire_teacher_photo_offset_y');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [resultsData, setResultsData] = useState<RankerResultItem[]>(() => {
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

  // Restore real Supabase Auth session and fetch real items on app launch
  useEffect(() => {
    supabaseService.getCurrentSessionUser()
      .then(user => {
        if (user) {
          setCurrentUser(user);
        }
      })
      .catch(() => {});

    supabaseService.getPastPapers().then(res => setSearchPapers(res)).catch(() => {});
    supabaseService.getStudyMaterials().then(res => setSearchMaterials(res)).catch(() => {});
    lessonService.syncWithSupabase().then(lessons => {
      const vids = lessons.flatMap(les => les.sessions.map(s => sessionToVideoModule(s, les)));
      setSearchVideos(vids);
    }).catch(() => {});
  }, []);

  // Keyboard shortcut for Spotlight search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch server-persisted teacher photo configuration so all public site visitors see the image
  useEffect(() => {
    fetch('/api/teacher-photo')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data.imageUrl) {
          setTeacherPhotoUrl(data.imageUrl);
          if (typeof data.scale === 'number') {
            setTeacherPhotoScale(data.scale);
          }
          if (typeof data.offsetY === 'number') {
            setTeacherPhotoOffsetY(data.offsetY);
          }
        } else {
          // If server doesn't have it yet, check if this browser has an uploaded image in localStorage
          // and auto-sync it to the public server!
          const localPhoto = localStorage.getItem('inspire_teacher_photo_cutout');
          const localScale = localStorage.getItem('inspire_teacher_photo_scale');
          const localOffset = localStorage.getItem('inspire_teacher_photo_offset_y');
          if (localPhoto) {
            setTeacherPhotoUrl(localPhoto);
            const scaleNum = localScale ? parseInt(localScale, 10) : 100;
            const offsetNum = localOffset ? parseInt(localOffset, 10) : 0;
            if (localScale) setTeacherPhotoScale(scaleNum);
            if (localOffset) setTeacherPhotoOffsetY(offsetNum);

            // Sync to server so all other public visitors receive it
            fetch('/api/teacher-photo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: localPhoto, scale: scaleNum, offsetY: offsetNum })
            }).catch(() => {});
          }
        }
      })
      .catch(() => {
        // Fallback to localStorage on network glitch
        const localPhoto = localStorage.getItem('inspire_teacher_photo_cutout');
        if (localPhoto) setTeacherPhotoUrl(localPhoto);
      });
  }, []);

  // Live broadcast listener for teacher photo changes across tabs and modals
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ imageUrl?: string | null; scale?: number; offsetY?: number }>;
      if (customEvent.detail) {
        if (customEvent.detail.imageUrl !== undefined) {
          setTeacherPhotoUrl(customEvent.detail.imageUrl);
        }
        if (typeof customEvent.detail.scale === 'number') {
          setTeacherPhotoScale(customEvent.detail.scale);
        }
        if (typeof customEvent.detail.offsetY === 'number') {
          setTeacherPhotoOffsetY(customEvent.detail.offsetY);
        }
      }
    };
    window.addEventListener('teacher-photo-updated', handleUpdate);
    return () => window.removeEventListener('teacher-photo-updated', handleUpdate);
  }, []);

  // Cart operations
  const handleAddToCart = (material: StudyMaterial) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.material.id === material.id);
      if (existing) {
        return prev.map(item =>
          item.material.id === material.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { material, quantity: 1 }];
    });
    setCartDrawerOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.material.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.material.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    setActiveTab('home');
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen apple-bg-ambient flex flex-col justify-between selection:bg-blue-500/20 selection:text-blue-900 relative">
      
      {/* Decorative Luminous Glass Reflection Mesh (Apple Blue Gradient) */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" 
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-sky-200/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-1/3 w-[650px] h-[650px] bg-blue-200/20 rounded-full blur-[140px]" />
      </div>

      {/* Top Floating Glass Navbar */}
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenCart={() => setCartDrawerOpen(true)}
        cartCount={totalCartCount}
        onOpenSignUp={() => setInstitutionSelectOpen(true)}
        onOpenLogin={() => {
          setActiveTab('login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area - Generous expansive layout eliminating empty gutters */}
      <main className="flex-1 w-full max-w-[1600px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 md:pt-6">
        {activeTab === 'home' && (
          <LandingPage
            currentUser={currentUser}
            onNavigate={setActiveTab}
            onOpenEnrollment={() => setInstitutionSelectOpen(true)}
            onOpenLogin={() => {
              setActiveTab('login');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectPaper={setSelectedPaper}
            onSelectRanker={setSelectedRanker}
            teacherImageUrl={teacherPhotoUrl || undefined}
            teacherImageScale={teacherPhotoScale}
            teacherImageOffsetY={teacherPhotoOffsetY}
            resultsData={resultsData}
          />
        )}

        {activeTab === 'lms' && (
          currentUser ? (
            <LMSDashboard
              currentUser={currentUser}
              onSelectVideo={setSelectedVideo}
              onSelectPaper={setSelectedPaper}
              onAddToCart={handleAddToCart}
              onNavigate={setActiveTab}
            />
          ) : (
            <StudentLoginPortal
              selectedInstitute={selectedInstitution}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                if (user.role === 'Admin') {
                  setActiveTab('admin');
                } else {
                  setActiveTab('lms');
                }
              }}
              onNavigate={setActiveTab}
              onOpenSignUp={() => setInstitutionSelectOpen(true)}
            />
          )
        )}

        {activeTab === 'past-papers' && (
          <PastPapersView
            onSelectPaper={setSelectedPaper}
          />
        )}

        {activeTab === 'live' && (
          <LiveClassesView
            currentUser={currentUser}
            onRequireLogin={() => {
              setActiveTab('login');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'videos' && (
          <VideoModulesView
            onSelectVideo={setSelectedVideo}
            currentUser={currentUser}
            onRequireLogin={() => {
              setActiveTab('login');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'store' && (
          <StudyMaterialsStore
            onAddToCart={handleAddToCart}
          />
        )}

        {activeTab === 'results' && (
          <ResultsView
            onSelectRanker={setSelectedRanker}
            onNavigate={setActiveTab}
            onOpenEnrollment={() => setInstitutionSelectOpen(true)}
          />
        )}

        {activeTab === 'login' && (
          <StudentLoginPortal
            selectedInstitute={selectedInstitution}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              if (user.role === 'Admin') {
                setActiveTab('admin');
              } else {
                setActiveTab('lms');
              }
            }}
            onNavigate={setActiveTab}
            onOpenSignUp={() => setInstitutionSelectOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser || {
              id: 'admin-001',
              name: 'Administrator',
              role: 'Admin',
              indexNumber: 'ADMIN-FACULTY',
              batch: 'Lead Faculty Board',
              overallProgress: 100,
              email: 'admin@inspire-education.lk',
              phone: '+94 77 123 4567'
            }}
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogout={handleLogout}
            teacherPhotoUrl={teacherPhotoUrl}
            teacherPhotoScale={teacherPhotoScale}
            teacherPhotoOffsetY={teacherPhotoOffsetY}
            onTeacherPhotoUpdated={(newUrl) => setTeacherPhotoUrl(newUrl)}
            onTeacherPhotoScaleUpdated={(newScale) => setTeacherPhotoScale(newScale)}
            onTeacherPhotoOffsetUpdated={(newOffset) => setTeacherPhotoOffsetY(newOffset)}
            resultsData={resultsData}
            onResultsUpdated={(newResults) => setResultsData(newResults)}
          />
        )}
      </main>

      {/* Footer (Clean Apple-Style Quiet Footer with Inspire Dark Logo) */}
      <footer className="w-full border-t border-slate-200/70 bg-white/60 backdrop-blur-xl mt-12 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-[1600px] 2xl:max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <InspireLogo size="md" />
            <div className="border-l border-slate-200 pl-3 text-left">
              <p className="font-bold text-slate-900">Inspire Institution</p>
              <p className="text-[11px] text-slate-400">Department of Examination Certified A/L Curriculum</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 font-medium">
            {currentUser?.role === 'Admin' ? (
              <>
                <button onClick={() => setActiveTab('admin')} className="text-blue-700 font-bold hover:text-blue-800 transition-colors">Admin Panel</button>
                <button onClick={() => setActiveTab('home')} className="hover:text-blue-700 transition-colors">Home</button>
                <button onClick={() => setActiveTab('live')} className="hover:text-blue-700 transition-colors">Live Classes</button>
                <button onClick={() => setActiveTab('lms')} className="hover:text-blue-700 transition-colors">LMS Dashboard</button>
                <button onClick={() => setActiveTab('past-papers')} className="hover:text-blue-700 transition-colors">Past Papers</button>
                <button onClick={() => setActiveTab('videos')} className="hover:text-blue-700 transition-colors">Lesson Modules</button>
                <button onClick={() => setActiveTab('store')} className="hover:text-blue-700 transition-colors">Study Store</button>
                <button onClick={() => setActiveTab('results')} className="hover:text-blue-700 transition-colors">Wall of Fame</button>
              </>
            ) : currentUser ? (
              <>
                <button onClick={() => setActiveTab('home')} className="hover:text-blue-700 transition-colors">Home</button>
                <button onClick={() => setActiveTab('live')} className="hover:text-blue-700 transition-colors">Live Classes</button>
                <button onClick={() => setActiveTab('lms')} className="hover:text-blue-700 transition-colors">LMS Dashboard</button>
                <button onClick={() => setActiveTab('past-papers')} className="hover:text-blue-700 transition-colors">Past Papers</button>
                <button onClick={() => setActiveTab('videos')} className="hover:text-blue-700 transition-colors">Lesson Modules</button>
                <button onClick={() => setActiveTab('store')} className="hover:text-blue-700 transition-colors">Study Store</button>
                <button onClick={() => setActiveTab('results')} className="hover:text-blue-700 transition-colors">Wall of Fame</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab('home')} className="hover:text-blue-700 transition-colors">Home</button>
                <button onClick={() => setActiveTab('live')} className="hover:text-blue-700 transition-colors">Live Classes</button>
                <button onClick={() => setActiveTab('past-papers')} className="hover:text-blue-700 transition-colors">Past Papers</button>
                <button onClick={() => setActiveTab('videos')} className="hover:text-blue-700 transition-colors">Lesson Modules</button>
                <button onClick={() => setActiveTab('results')} className="hover:text-blue-700 transition-colors">Wall of Fame</button>
                <button onClick={() => setActiveTab('store')} className="hover:text-blue-700 transition-colors">Study Store</button>
                <button onClick={() => setInstitutionSelectOpen(true)} className="hover:text-blue-700 transition-colors">Institutes</button>
                <button onClick={() => {
                  setActiveTab('login');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className="hover:text-blue-700 transition-colors">Student Login</button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Inspire Institution. All rights reserved.</span>
            <button
              onClick={() => {
                if (currentUser?.role === 'Admin') {
                  setActiveTab('admin');
                } else {
                  setActiveTab('login');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-500 hover:text-slate-800 font-semibold underline transition-colors"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Nav for Mobile Screens */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
        isLoggedIn={Boolean(currentUser)}
        onOpenLogin={() => {
          setActiveTab('login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Interactive Institution Select Modal (Required ONLY when signing up) */}
      <InstitutionSelectModal
        isOpen={institutionSelectOpen}
        onClose={() => setInstitutionSelectOpen(false)}
        onSelectInstitute={(inst) => {
          setSelectedInstitution(inst);
          setInstitutionSelectOpen(false);
          setEnrollmentModalOpen(true);
        }}
      />

      {/* Interactive Modals */}
      <PdfReaderModal
        paper={selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />

      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      <WallOfFameModal
        ranker={selectedRanker}
        onClose={() => setSelectedRanker(null)}
      />

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        pastPapers={searchPapers}
        videos={searchVideos}
        materials={searchMaterials}
        onSelectPaper={(p) => {
          setSelectedPaper(p);
          setActiveTab('past-papers');
        }}
        onSelectVideo={(v) => {
          setSelectedVideo(v);
          setActiveTab('videos');
        }}
        onSelectMaterial={(m) => {
          handleAddToCart(m);
        }}
      />

      <EnrollmentModal
        isOpen={enrollmentModalOpen}
        onClose={() => setEnrollmentModalOpen(false)}
        selectedInstitute={selectedInstitution}
        onChangeInstitute={() => {
          setEnrollmentModalOpen(false);
          setInstitutionSelectOpen(true);
        }}
        onGoToLogin={() => {
          setEnrollmentModalOpen(false);
          setActiveTab('login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Faculty Administrator Control Console */}
      <AdminPanelModal
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
        onTeacherPhotoUpdated={(newUrl) => setTeacherPhotoUrl(newUrl)}
        onTeacherPhotoScaleUpdated={(newScale) => setTeacherPhotoScale(newScale)}
        onTeacherPhotoOffsetUpdated={(newOffset) => setTeacherPhotoOffsetY(newOffset)}
        onResultsUpdated={(newResults) => setResultsData(newResults)}
      />
    </div>
  );
}
