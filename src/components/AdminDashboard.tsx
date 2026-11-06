import React, { useState, useEffect } from 'react';
import { 
  CurrentUser, 
  EnrolledStudent, 
  StoreOrder, 
  PastPaper, 
  VideoModule, 
  ActiveTab,
  LessonModule,
  LessonSession,
  PaymentSlip,
  GeneralSettings,
  CategorizedMaterial,
  LiveClass
} from '../types';
import { DbInstitution } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { RankerResultItem, defaultResultsData } from './PreviousResultsSection';
import { 
  lessonService, 
  MONTH_LIST, 
  BATCH_LIST 
} from '../services/lessonService';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Video, 
  ShoppingBag, 
  Image as ImageIcon, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  ExternalLink, 
  Save, 
  RefreshCw, 
  Check, 
  X, 
  TrendingUp, 
  Download, 
  FileText,
  DollarSign,
  Layers,
  Calendar,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Building2,
  CreditCard,
  Eye,
  Settings,
  Radio,
  Upload,
  Lock,
  Unlock
} from 'lucide-react';
import { PaymentSlipsTab } from './admin/PaymentSlipsTab';
import { MaterialUploadsTab } from './admin/MaterialUploadsTab';
import { GeneralSettingsTab } from './admin/GeneralSettingsTab';
import { LiveClassesScheduler } from './admin/LiveClassesScheduler';

interface AdminDashboardProps {
  currentUser: CurrentUser;
  onNavigate: (tab: ActiveTab) => void;
  onLogout: () => void;
  teacherPhotoUrl?: string | null;
  teacherPhotoScale: number;
  teacherPhotoOffsetY: number;
  onTeacherPhotoUpdated: (url: string | null) => void;
  onTeacherPhotoScaleUpdated: (scale: number) => void;
  onTeacherPhotoOffsetUpdated: (offset: number) => void;
  resultsData: RankerResultItem[];
  onResultsUpdated: (results: RankerResultItem[]) => void;
}

type AdminTab = 'overview' | 'students' | 'content' | 'slips' | 'materials' | 'settings' | 'orders';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigate,
  onLogout,
  teacherPhotoUrl,
  teacherPhotoScale,
  teacherPhotoOffsetY,
  onTeacherPhotoUpdated,
  onTeacherPhotoScaleUpdated,
  onTeacherPhotoOffsetUpdated,
  resultsData,
  onResultsUpdated
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student state (Real Supabase student profiles)
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBatchFilter, setStudentBatchFilter] = useState<string>('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('all');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    mobile: '',
    email: '',
    batch: '2025 A/L',
    institution: 'Rotary Hall - Nugegoda'
  });

  // Orders state (Real Supabase Stu_Reciepts & receipt_requests)
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Content state (Lessons & Past Papers strictly from database & R2 storage)
  const [lessonsList, setLessonsList] = useState<LessonModule[]>(() => lessonService.getLessons());
  const [expandedLessonMap, setExpandedLessonMap] = useState<Record<string, boolean>>({});
  
  const [papersList, setPapersList] = useState<PastPaper[]>([]);
  const [contentSubTab, setContentSubTab] = useState<'lessons' | 'papers' | 'live'>('lessons');
  const [showAddPaperModal, setShowAddPaperModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);

  // Form states for new content
  const [newPaper, setNewPaper] = useState({
    title: '',
    year: 2025,
    medium: 'sinhala' as 'sinhala' | 'english' | 'tamil',
    subject: 'Accounting Principles',
    fileSize: '4.5 MB',
    pages: 20,
    hasMarkingScheme: true
  });

  const [newLesson, setNewLesson] = useState({
    title: '',
    batch: 'A/L 2025',
    description: '',
    price: 3000
  });

  const [newSession, setNewSession] = useState({
    lessonId: '',
    title: '',
    month: 'August',
    youtubeUrl: '',
    duration: '1h 45m',
    isFree: false,
    description: ''
  });

  // Slips, Materials, and Live Classes state
  const [slipsList, setSlipsList] = useState<PaymentSlip[]>([]);
  const [materialsList, setMaterialsList] = useState<CategorizedMaterial[]>([]);
  const [liveClassesList, setLiveClassesList] = useState<LiveClass[]>([]);

  const refreshSlips = () => {
    supabaseService.getPaymentSlips().then(setSlipsList).catch(() => {});
  };

  const refreshMaterials = () => {
    supabaseService.getCategorizedMaterials().then(setMaterialsList).catch(() => {});
  };

  const refreshLiveClasses = () => {
    supabaseService.getLiveClasses().then(setLiveClassesList).catch(() => {});
  };

  // Fetch real data from Supabase and R2 storage on mount
  useEffect(() => {
    supabaseService.getEnrolledStudents()
      .then(res => setStudents(res))
      .catch(() => {});

    supabaseService.getStoreOrders()
      .then(res => setOrders(res))
      .catch(() => {});

    supabaseService.getPastPapers()
      .then(res => setPapersList(res))
      .catch(() => {});

    lessonService.syncWithSupabase()
      .then(synced => setLessonsList(synced))
      .catch(() => {});

    refreshSlips();
    refreshMaterials();
    refreshLiveClasses();

    const handleUpdate = () => {
      setLessonsList(lessonService.getLessons());
    };
    const handleStudentsUpdate = () => {
      supabaseService.getEnrolledStudents()
        .then(res => setStudents(res))
        .catch(() => {});
    };
    window.addEventListener('inspire-lessons-updated', handleUpdate);
    window.addEventListener('inspire-students-updated', handleStudentsUpdate);
    window.addEventListener('inspire-slips-updated', refreshSlips);
    window.addEventListener('inspire-materials-updated', refreshMaterials);
    window.addEventListener('inspire-live-classes-updated', refreshLiveClasses);
    return () => {
      window.removeEventListener('inspire-lessons-updated', handleUpdate);
      window.removeEventListener('inspire-students-updated', handleStudentsUpdate);
      window.removeEventListener('inspire-slips-updated', refreshSlips);
      window.removeEventListener('inspire-materials-updated', refreshMaterials);
      window.removeEventListener('inspire-live-classes-updated', refreshLiveClasses);
    };
  }, []);

  // Expand first lesson by default
  useEffect(() => {
    if (lessonsList.length > 0 && Object.keys(expandedLessonMap).length === 0) {
      setExpandedLessonMap({ [lessonsList[0].id]: true });
    }
    // Set default lesson for session selector if unset
    if (lessonsList.length > 0 && !newSession.lessonId) {
      setNewSession(prev => ({ ...prev, lessonId: lessonsList[0].id }));
    }
  }, [lessonsList]);

  // Local teacher photo adjustments
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>(teacherPhotoUrl || '');
  const [currentScale, setCurrentScale] = useState<number>(teacherPhotoScale);
  const [currentOffset, setCurrentOffset] = useState<number>(teacherPhotoOffsetY);

  useEffect(() => {
    if (teacherPhotoUrl !== undefined && teacherPhotoUrl !== null) {
      setCurrentPhotoUrl(teacherPhotoUrl);
    }
  }, [teacherPhotoUrl]);

  useEffect(() => {
    setCurrentScale(teacherPhotoScale);
  }, [teacherPhotoScale]);

  useEffect(() => {
    setCurrentOffset(teacherPhotoOffsetY);
  }, [teacherPhotoOffsetY]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Student operations
  const handleVerifyStudent = async (id: string) => {
    await supabaseService.approveStudent(id);
    setStudents(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, status: 'Verified' as const, isApproved: true, modulesAccessible: 8 } : s);
      localStorage.setItem('inspire_admin_students', JSON.stringify(updated));
      return updated;
    });
    showToast('Student enrollment approved and marked Verified');
  };

  const handleCycleDeviceLimit = async (student: EnrolledStudent) => {
    // 1 Device -> 2 Devices -> Unlimited (999) -> 1 Device
    const currentLimit = student.maxDevices || 1;
    let nextLimit = 1;
    let label = '1 Device';
    if (currentLimit === 1) {
      nextLimit = 2;
      label = '2 Devices';
    } else if (currentLimit === 2) {
      nextLimit = 999;
      label = 'Unlimited Devices (∞)';
    } else {
      nextLimit = 1;
      label = '1 Device';
    }

    await supabaseService.updateStudentMaxDevices(student.id, nextLimit);

    setStudents(prev => {
      const updated = prev.map(s => s.id === student.id ? { ...s, maxDevices: nextLimit } : s);
      localStorage.setItem('inspire_admin_students', JSON.stringify(updated));
      return updated;
    });

    showToast(`Updated allowed devices to ${label} for ${student.fullName}`);
  };

  const handleToggleSuspendStudent = (id: string) => {
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          const nextStatus = s.status === 'Suspended' ? 'Verified' : 'Suspended';
          return { ...s, status: nextStatus as 'Verified' | 'Suspended' };
        }
        return s;
      });
      localStorage.setItem('inspire_admin_students', JSON.stringify(updated));
      return updated;
    });
    showToast('Student status updated');
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.fullName.trim() || !newStudent.mobile.trim()) return;

    const newEntry: EnrolledStudent = {
      id: `stu-${Date.now()}`,
      indexNumber: `2026-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: newStudent.fullName,
      mobile: newStudent.mobile,
      email: newStudent.email || `${newStudent.fullName.toLowerCase().replace(/\s+/g, '.')}@student.lk`,
      batch: newStudent.batch,
      institution: newStudent.institution,
      status: 'Verified',
      enrolledDate: 'Today',
      modulesAccessible: 8,
      maxDevices: 1,
      isApproved: true
    };

    setStudents(prev => {
      const updated = [newEntry, ...prev];
      localStorage.setItem('inspire_admin_students', JSON.stringify(updated));
      return updated;
    });
    setShowAddStudentModal(false);
    setNewStudent({
      fullName: '',
      mobile: '',
      email: '',
      batch: '2025 A/L',
      institution: 'Rotary Hall - Nugegoda'
    });
    showToast(`Registered student ${newEntry.indexNumber} successfully!`);
  };

  // Order operations
  const handleUpdateOrderStatus = (orderId: string, status: 'Processing' | 'Dispatched' | 'Delivered') => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status } : o);
      localStorage.setItem('inspire_admin_orders', JSON.stringify(updated));
      return updated;
    });
    showToast(`Order status updated to ${status}`);
  };

  // Lesson & Session operations
  const handleCreateLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.title.trim()) return;

    try {
      const created = await lessonService.createLesson({
        title: newLesson.title.trim(),
        batch: newLesson.batch,
        description: newLesson.description.trim() || 'Comprehensive syllabus module with structured sessions and past paper reviews.',
        price: Number(newLesson.price) || 3000
      });
      setLessonsList(lessonService.getLessons());
      setShowAddLessonModal(false);
      setNewLesson({
        title: '',
        batch: 'A/L 2025',
        description: '',
        price: 3000
      });
      // Expand the newly created lesson
      setExpandedLessonMap(prev => ({ ...prev, [created.id]: true }));
      showToast(`Lesson "${created.title}" created successfully!`);
    } catch (err: any) {
      showToast(`Failed to create lesson: ${err?.message || 'Error'}`);
    }
  };

  const handleAddSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.title.trim()) {
      showToast('Please enter a session title');
      return;
    }
    if (!newSession.lessonId) {
      showToast('Please select a lesson to attach this session to');
      return;
    }

    try {
      const created = await lessonService.addSessionToLesson({
        lessonId: newSession.lessonId,
        title: newSession.title.trim(),
        month: newSession.month,
        youtubeUrl: newSession.youtubeUrl.trim(),
        duration: newSession.duration.trim() || '1h 45m',
        isFree: newSession.isFree,
        description: newSession.description.trim()
      });

      setLessonsList(lessonService.getLessons());
      // Make sure the target lesson is expanded
      setExpandedLessonMap(prev => ({ ...prev, [newSession.lessonId]: true }));
      setShowAddSessionModal(false);
      setNewSession(prev => ({
        ...prev,
        title: '',
        youtubeUrl: '',
        description: ''
      }));
      showToast(`Session added for month ${created.month} successfully!`);
    } catch (err: any) {
      showToast(`Failed to add session: ${err?.message || 'Error'}`);
    }
  };

  const handleDeleteSession = async (lessonId: string, sessionId: string, title?: string) => {
    try {
      await lessonService.deleteSession(lessonId, sessionId);
      setLessonsList(lessonService.getLessons());
      showToast(`Session ${title ? `"${title}" ` : ''}removed successfully`);
    } catch {
      showToast('Could not remove session');
    }
  };

  const handleDeleteLesson = async (lessonId: string, title?: string) => {
    try {
      await lessonService.deleteLesson(lessonId);
      setLessonsList(lessonService.getLessons());
      showToast(`Lesson ${title ? `"${title}" ` : ''}deleted successfully`);
    } catch {
      showToast('Could not delete lesson');
    }
  };

  const handleDeletePaper = async (paperId: string, title?: string) => {
    try {
      await supabaseService.deletePastPaper(paperId);
      setPapersList(prev => prev.filter(p => p.id !== paperId));
      showToast(`Past Paper ${title ? `"${title}" ` : ''}deleted`);
    } catch {
      showToast('Could not delete past paper');
    }
  };

  const handleDeleteStudent = async (studentId: string, name?: string) => {
    try {
      await supabaseService.deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      showToast(`Student record ${name ? `"${name}" ` : ''}removed`);
    } catch {
      showToast('Could not delete student record');
    }
  };

  const handleOpenAddSessionForLesson = (lessonId: string) => {
    setNewSession(prev => ({ ...prev, lessonId }));
    setShowAddSessionModal(true);
  };

  // Past paper operations
  const handleAddPaper = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: PastPaper = {
      id: `pp-${Date.now()}`,
      year: newPaper.year,
      subject: newPaper.subject,
      medium: newPaper.medium,
      title: newPaper.title || `${newPaper.year} Assessment Paper`,
      subtitle: 'Faculty Certified Marking Scheme Attached',
      pages: newPaper.pages,
      fileSize: newPaper.fileSize,
      hasMarkingScheme: newPaper.hasMarkingScheme,
      downloadCount: 0,
      category: 'Final Exam'
    };
    setPapersList(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('inspire_admin_papers', JSON.stringify(updated));
      return updated;
    });
    setShowAddPaperModal(false);
    setNewPaper({
      title: '',
      year: 2025,
      medium: 'sinhala',
      subject: 'Accounting Principles',
      fileSize: '4.5 MB',
      pages: 20,
      hasMarkingScheme: true
    });
    showToast('New Past Paper added to digital library');
  };

  // Faculty portrait calibrator
  const handleSavePhotoUrl = (url: string) => {
    const trimmed = (url || '').trim();
    setCurrentPhotoUrl(trimmed);
    onTeacherPhotoUpdated(trimmed || null);
    if (trimmed) {
      localStorage.setItem('inspire_teacher_photo_cutout', trimmed);
    } else {
      localStorage.removeItem('inspire_teacher_photo_cutout');
    }

    window.dispatchEvent(new CustomEvent('teacher-photo-updated', {
      detail: { imageUrl: trimmed || null, scale: currentScale, offsetY: currentOffset }
    }));

    fetch('/api/teacher-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: trimmed || null, scale: currentScale, offsetY: currentOffset })
    }).catch(err => console.warn('Could not persist to server:', err));

    showToast(trimmed ? 'Faculty portrait updated and synced across all pages' : 'Reset to default faculty portrait');
  };

  const handleScaleSlider = (newScale: number) => {
    setCurrentScale(newScale);
    onTeacherPhotoScaleUpdated(newScale);
    localStorage.setItem('inspire_teacher_photo_scale', newScale.toString());

    window.dispatchEvent(new CustomEvent('teacher-photo-updated', {
      detail: { imageUrl: currentPhotoUrl || null, scale: newScale, offsetY: currentOffset }
    }));

    fetch('/api/teacher-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: currentPhotoUrl || null, scale: newScale, offsetY: currentOffset })
    }).catch(() => {});
  };

  const handleOffsetSlider = (newOffset: number) => {
    setCurrentOffset(newOffset);
    onTeacherPhotoOffsetUpdated(newOffset);
    localStorage.setItem('inspire_teacher_photo_offset_y', newOffset.toString());

    window.dispatchEvent(new CustomEvent('teacher-photo-updated', {
      detail: { imageUrl: currentPhotoUrl || null, scale: currentScale, offsetY: newOffset }
    }));

    fetch('/api/teacher-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: currentPhotoUrl || null, scale: currentScale, offsetY: newOffset })
    }).catch(() => {});
  };

  // Results update handler
  const handleUpdateResultItem = (index: number, updatedItem: RankerResultItem) => {
    const nextResults = [...resultsData];
    nextResults[index] = updatedItem;
    onResultsUpdated(nextResults);
    localStorage.setItem('inspire_exam_results_custom', JSON.stringify(nextResults));
    showToast(`Updated student ${updatedItem.studentName} result`);
  };

  const handleResetResultsToDefault = () => {
    onResultsUpdated(defaultResultsData);
    localStorage.removeItem('inspire_exam_results_custom');
    showToast('Restored default examination ranker results');
  };

  // Filtered queries
  const filteredStudents = students.filter(s => {
    const matchSearch = studentSearch === '' || 
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.indexNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.mobile.includes(studentSearch);
    const matchBatch = studentBatchFilter === 'all' || s.batch === studentBatchFilter;
    const matchStatus = studentStatusFilter === 'all' || s.status === studentStatusFilter;
    return matchSearch && matchBatch && matchStatus;
  });

  const filteredOrders = orders.filter(o => {
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchSearch = orderSearch === '' || 
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.studentName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.itemsSummary.toLowerCase().includes(orderSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingApprovalsCount = students.filter(s => s.status === 'Pending Approval').length;
  const pendingSlipsCount = slipsList.filter(s => s.status === 'pending').length;
  const processingOrdersCount = orders.filter(o => o.status === 'Processing').length;
  const totalRevenueLKR = orders.reduce((sum, o) => sum + o.totalAmountLKR, 0);
  const totalSessionsCount = lessonsList.reduce((acc, l) => acc + l.sessions.length, 0);

  return (
    <div className="space-y-8 pb-24 text-left">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-sans font-semibold">
            <span className="text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ADMINISTRATIVE CONTROL PANEL
            </span>
            <span aria-hidden="true">·</span>
            <span>Inspire Academic Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Faculty &amp; Portal Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Authenticated as <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.email || 'admin'})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('lms')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Student LMS View</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Clean Segmented Tab Bar */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 flex flex-wrap gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'students'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Students</span>
          {pendingApprovalsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'content'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Curricula &amp; Live</span>
        </button>

        <button
          onClick={() => setActiveTab('slips')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'slips'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Payment Slip Approval</span>
          {pendingSlipsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingSlipsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'materials'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4 text-indigo-600" />
          <span>Material Uploads</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-700" />
          <span>General Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-600" />
          <span>Store Orders</span>
          {processingOrdersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
              {processingOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW & KEY METRICS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-left">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Total Enrolled Students</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-slate-950 font-mono tabular-nums">
                {students.length}
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="text-emerald-700 font-bold">{pendingApprovalsCount} pending approvals</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-left">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Lesson Sessions Published</span>
                <Video className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-3xl font-black text-slate-950 font-mono tabular-nums">
                {totalSessionsCount}
              </p>
              <div className="text-[11px] text-slate-500">
                <span>{lessonsList.length} distinct syllabus lesson modules</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-left">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Past Papers Archive</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-black text-slate-950 font-mono tabular-nums">
                {papersList.length}
              </p>
              <div className="text-[11px] text-slate-500">
                <span>Certified LKAS marking schemes</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-left">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Store Orders Volume</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-3xl font-black text-slate-950 font-mono tabular-nums">
                LKR {totalRevenueLKR.toLocaleString()}
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="text-blue-600 font-bold">{orders.length} total orders</span>
                <span>({processingOrdersCount} to dispatch)</span>
              </div>
            </div>

          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Student Verification</h3>
                  <p className="text-xs text-slate-500">Approve admission receipts</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review pending registrations from Colombo, Gampaha, and online students awaiting portal index access.
              </p>
              <button
                onClick={() => setActiveTab('students')}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Manage Enrollments</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manage Lessons &amp; Sessions</h3>
                  <p className="text-xs text-slate-500">Create lessons, add YouTube sessions</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create new lessons, attach sessions with YouTube stream links, and assign them to specific months.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab('content');
                    setShowAddLessonModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Lesson</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('content');
                    setShowAddSessionModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Session</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tute Pack Dispatch</h3>
                  <p className="text-xs text-slate-500">Physical book courier orders</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate courier dispatch slips and mark student book deliveries as dispatched across islandwide centers.
              </p>
              <button
                onClick={() => setActiveTab('orders')}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Process Orders Queue</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: STUDENTS & ENROLLMENTS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-5 text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Student Admission &amp; LMS Index Ledger</h2>
              <p className="text-xs text-slate-500">
                Verify student payment receipts, manage module permissions, and register new enrollments.
              </p>
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll New Student</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student name, Index No, or mobile..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={studentBatchFilter}
                onChange={(e) => setStudentBatchFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Batches</option>
                <option value="2025 A/L">2025 A/L</option>
                <option value="2026 A/L">2026 A/L</option>
              </select>

              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* High-Density Students Data Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4">Index No.</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Mobile &amp; Email</th>
                    <th className="py-3 px-4">Batch / Institute</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Allowed Devices</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No student records match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                          {s.indexNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{s.fullName}</p>
                          <p className="text-[11px] text-slate-400">Enrolled: {s.enrolledDate}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono tabular-nums text-slate-700">{s.mobile}</p>
                          <p className="text-[11px] text-slate-400">{s.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-800">{s.batch}</p>
                          <p className="text-[11px] text-slate-500">{s.institution}</p>
                        </td>
                        <td className="py-3 px-4">
                          {s.status === 'Verified' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          )}
                          {s.status === 'Pending Approval' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                          {s.status === 'Suspended' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Suspended</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleCycleDeviceLimit(s)}
                            title="Click to cycle: 1 Device → 2 Devices → Unlimited (∞)"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                              (s.maxDevices || 1) >= 999
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : (s.maxDevices || 1) === 2
                                ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>
                              {(s.maxDevices || 1) >= 999
                                ? 'Unlimited (∞)'
                                : (s.maxDevices || 1) === 2
                                ? '2 Devices'
                                : '1 Device'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(!s.isApproved || s.status === 'Pending Approval') && (
                              <button
                                onClick={() => handleVerifyStudent(s.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleSuspendStudent(s.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                                s.status === 'Suspended'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {s.status === 'Suspended' ? 'Reinstate' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id, s.fullName)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Student Record"
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: CONTENT MANAGEMENT (LESSON MODULES & PAST PAPERS)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6 text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Curriculum &amp; Resource Publications</h2>
              <p className="text-xs text-slate-500">
                Create lesson modules, attach interactive sessions with YouTube links and months, and publish past papers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex text-xs font-bold">
                <button
                  onClick={() => setContentSubTab('lessons')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    contentSubTab === 'lessons'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lessons &amp; Sessions ({lessonsList.length})
                </button>
                <button
                  onClick={() => setContentSubTab('papers')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    contentSubTab === 'papers'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Past Papers ({papersList.length})
                </button>
                <button
                  onClick={() => setContentSubTab('live')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    contentSubTab === 'live'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Scheduled Live Classes ({liveClassesList.length})</span>
                </button>
              </div>

              {contentSubTab === 'lessons' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddLessonModal(true)}
                    className="py-2 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Lesson</span>
                  </button>
                  <button
                    onClick={() => setShowAddSessionModal(true)}
                    className="py-2 px-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Session</span>
                  </button>
                </div>
              )}
              {contentSubTab === 'papers' && (
                <button
                  onClick={() => setShowAddPaperModal(true)}
                  className="py-2 px-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Past Paper</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub Tab: Lessons & Sessions List */}
          {contentSubTab === 'lessons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1">
                <span>
                  Showing <strong className="text-slate-900">{lessonsList.length}</strong> lessons with <strong className="text-slate-900">{totalSessionsCount}</strong> attached sessions
                </span>
                <span className="text-[11px] text-slate-400">
                  Changes save to Supabase tables and persist locally
                </span>
              </div>

              {lessonsList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-2">
                  <Layers className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700">No lessons created yet</p>
                  <p>Click "Create Lesson" above to add your first lesson module.</p>
                </div>
              ) : (
                lessonsList.map((lesson) => {
                  const isExpanded = expandedLessonMap[lesson.id] ?? false;

                  return (
                    <div
                      key={lesson.id}
                      className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all duration-200"
                    >
                      {/* Lesson Header */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                              {lesson.batch}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                              {lesson.sessions.length} {lesson.sessions.length === 1 ? 'Session' : 'Sessions'}
                            </span>
                            {lesson.id.startsWith('db-les-') && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                                Supabase Linked
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            {lesson.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                            {lesson.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenAddSessionForLesson(lesson.id)}
                            className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Session</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedLessonMap(prev => ({ ...prev, [lesson.id]: !prev[lesson.id] }))}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Sessions List Accordion Body */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 space-y-3 bg-white">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-slate-100 pb-2">
                            <span>Attached Sessions</span>
                            <span>Month / YouTube Stream</span>
                          </div>

                          {lesson.sessions.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400">
                              No sessions added yet. Click "Add Session" to attach YouTube videos and designate the month.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {lesson.sessions.map((session, sIdx) => (
                                <div
                                  key={session.id}
                                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold text-slate-400">
                                        #{sIdx + 1}
                                      </span>
                                      <h4 className="text-xs font-bold text-slate-900">
                                        {session.title}
                                      </h4>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                                        {session.month} Session
                                      </span>
                                      <span>·</span>
                                      <span>{session.duration}</span>
                                      <span>·</span>
                                      <span className={session.isFree ? 'text-emerald-600 font-bold' : 'text-slate-600 font-medium'}>
                                        {session.isFree ? 'Free Preview' : 'Enrolled Only'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    {session.youtubeUrl ? (
                                      <a
                                        href={session.youtubeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-[11px] font-bold border border-red-200 transition-colors"
                                      >
                                        <Play className="w-3 h-3 fill-red-700" />
                                        <span>Test YouTube Link</span>
                                        <ExternalLink className="w-3 h-3 ml-0.5" />
                                      </a>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">No YouTube link</span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSession(lesson.id, session.id, session.title)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Session"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Sub Tab: Past Papers List */}
          {contentSubTab === 'papers' && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-4">Year &amp; Title</th>
                      <th className="py-3 px-4">Medium</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">File Size / Pages</th>
                      <th className="py-3 px-4">Marking Scheme</th>
                      <th className="py-3 px-4 text-center">Downloads</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {papersList.map((paper) => (
                      <tr key={paper.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-blue-700 mr-2">{paper.year}</span>
                          <span className="font-bold text-slate-900">{paper.title}</span>
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-700 font-medium">
                          {paper.medium} Medium
                        </td>
                        <td className="py-3 px-4 text-slate-700">{paper.subject}</td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                          {paper.fileSize} · {paper.pages} pages
                        </td>
                        <td className="py-3 px-4">
                          {paper.hasMarkingScheme ? (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">In preparation</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-900">
                          {paper.downloadCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePaper(paper.id, paper.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Past Paper"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: Live Classes Scheduling */}
          {contentSubTab === 'live' && (
            <LiveClassesScheduler
              liveClasses={liveClassesList}
              onRefresh={refreshLiveClasses}
              showToast={showToast}
            />
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: STUDY STORE INVENTORY & ORDERS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-5 text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Study Store Orders &amp; Dispatch Queue</h2>
              <p className="text-xs text-slate-500">
                Track physical book orders, student delivery addresses, and courier dispatch statuses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="all">All Orders ({orders.length})</option>
                <option value="Processing">Processing</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4">Order ID &amp; Date</th>
                    <th className="py-3 px-4">Recipient Student</th>
                    <th className="py-3 px-4">Delivery Address</th>
                    <th className="py-3 px-4">Ordered Items</th>
                    <th className="py-3 px-4">Amount &amp; Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No orders found in this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-slate-900">{o.orderNumber}</p>
                          <p className="text-[11px] text-slate-400">{o.orderDate}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{o.studentName}</p>
                          <p className="text-[11px] font-mono text-slate-500">{o.studentMobile}</p>
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate text-slate-600" title={o.deliveryAddress}>
                          {o.deliveryAddress}
                        </td>
                        <td className="py-3 px-4 max-w-[220px]">
                          <p className="truncate text-slate-800 font-medium" title={o.itemsSummary}>
                            {o.itemsSummary}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-slate-900 tabular-nums">
                            LKR {o.totalAmountLKR.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400">{o.paymentMethod}</p>
                        </td>
                        <td className="py-3 px-4">
                          {o.status === 'Processing' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Processing</span>
                            </span>
                          )}
                          {o.status === 'Dispatched' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                              <TrendingUp className="w-3 h-3 text-blue-600" />
                              <span>Dispatched</span>
                            </span>
                          )}
                          {o.status === 'Delivered' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Delivered</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {o.status !== 'Dispatched' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, 'Dispatched')}
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer"
                              >
                                Dispatch
                              </button>
                            )}
                            {o.status !== 'Delivered' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                              >
                                Deliver
                              </button>
                            )}
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: PAYMENT SLIP APPROVAL
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'slips' && (
        <PaymentSlipsTab
          slips={slipsList}
          onRefresh={refreshSlips}
          showToast={showToast}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: MATERIAL UPLOADS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'materials' && (
        <MaterialUploadsTab
          materials={materialsList}
          onRefresh={refreshMaterials}
          showToast={showToast}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 7: GENERAL SETTINGS (Institutes, Bank Details, Cutout, Results)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <GeneralSettingsTab
          currentPhotoUrl={currentPhotoUrl}
          currentScale={currentScale}
          currentOffset={currentOffset}
          onSavePhotoUrl={handleSavePhotoUrl}
          onScaleChange={handleScaleSlider}
          onOffsetChange={handleOffsetSlider}
          resultsData={resultsData}
          onUpdateResultItem={handleUpdateResultItem}
          onResetResultsToDefault={handleResetResultsToDefault}
          showToast={showToast}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD NEW STUDENT
         ───────────────────────────────────────────────────────────── */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Enroll New Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Student Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.fullName}
                  onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                  placeholder="e.g. Kasun Chamara"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Contact</label>
                <input
                  type="text"
                  required
                  value={newStudent.mobile}
                  onChange={(e) => setNewStudent({ ...newStudent, mobile: e.target.value })}
                  placeholder="077 123 4567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">A/L Target Batch</label>
                <select
                  value={newStudent.batch}
                  onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="2025 A/L">2025 A/L</option>
                  <option value="2026 A/L">2026 A/L</option>
                  <option value="2027 A/L">2027 A/L</option>
                  <option value="2028 A/L">2028 A/L</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tuition Center / Branch</label>
                <select
                  value={newStudent.institution}
                  onChange={(e) => setNewStudent({ ...newStudent, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="Rotary Hall - Nugegoda">Rotary Hall - Nugegoda</option>
                  <option value="Syzygy - Gampaha">Syzygy - Gampaha</option>
                  <option value="Sipsewana - Kurunegala">Sipsewana - Kurunegala</option>
                  <option value="Inspire Online Portal">Inspire Online Portal</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: CREATE NEW LESSON
         ───────────────────────────────────────────────────────────── */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Create New Lesson Module</h3>
                <p className="text-[11px] text-slate-500">Group curriculum sessions under this lesson</p>
              </div>
              <button onClick={() => setShowAddLessonModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLessonSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                  placeholder="e.g. Lesson 05: Consolidated Financial Statements (Group Accounts)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Batch</label>
                  <select
                    value={newLesson.batch}
                    onChange={(e) => setNewLesson({ ...newLesson, batch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  >
                    {BATCH_LIST.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Module Price (LKR)</label>
                  <input
                    type="number"
                    value={newLesson.price}
                    onChange={(e) => setNewLesson({ ...newLesson, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Syllabus Notes</label>
                <textarea
                  rows={3}
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                  placeholder="Outline the core theory principles, LKAS standards, and exam questions covered in this lesson..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: ADD SESSION TO LESSON (With YouTube Link & Month Picker)
         ───────────────────────────────────────────────────────────── */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Add Session to Lesson</h3>
                <p className="text-[11px] text-slate-500">Attach a YouTube video session and select the scheduled month</p>
              </div>
              <button onClick={() => setShowAddSessionModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSessionSubmit} className="space-y-3.5 text-xs">
              {/* Select Lesson dropdown */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Lesson Module</label>
                <select
                  required
                  value={newSession.lessonId}
                  onChange={(e) => setNewSession({ ...newSession, lessonId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-semibold text-slate-900"
                >
                  {lessonsList.map(les => (
                    <option key={les.id} value={les.id}>
                      [{les.batch}] {les.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  placeholder="e.g. Session 1: Inter-company balances & Unrealized Profit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Month Picker & Duration */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Scheduled Month (Required)
                  </label>
                  <select
                    value={newSession.month}
                    onChange={(e) => setNewSession({ ...newSession, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold text-purple-700"
                  >
                    {MONTH_LIST.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={newSession.duration}
                    onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })}
                    placeholder="1h 45m"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* YouTube Video URL */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  YouTube Video Link (Embed / Stream)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={newSession.youtubeUrl}
                    onChange={(e) => setNewSession({ ...newSession, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <Play className="w-3.5 h-3.5 text-red-600 absolute left-2.5 top-1/2 -translate-y-1/2 fill-red-600" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Accepts standard YouTube URLs (e.g., https://youtu.be/... or watch?v=...). Students can stream directly.
                </p>
              </div>

              {/* Free Preview check */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sessionIsFree"
                  checked={newSession.isFree}
                  onChange={(e) => setNewSession({ ...newSession, isFree: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded-sm"
                />
                <label htmlFor="sessionIsFree" className="font-semibold text-slate-700 cursor-pointer">
                  Mark as Free Open Preview Session (accessible to non-enrolled students)
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Summary / Key Topics</label>
                <textarea
                  rows={2}
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  placeholder="Outline key calculation adjustments or exam questions analyzed..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save &amp; Publish Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: ADD NEW PAST PAPER
         ───────────────────────────────────────────────────────────── */}
      {showAddPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Publish New Past Paper</h3>
              <button onClick={() => setShowAddPaperModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddPaper} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Paper Title</label>
                <input
                  type="text"
                  required
                  value={newPaper.title}
                  onChange={(e) => setNewPaper({ ...newPaper, title: e.target.value })}
                  placeholder="e.g. 2025 Pre-Board Accounting Evaluation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={newPaper.year}
                    onChange={(e) => setNewPaper({ ...newPaper, year: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Medium</label>
                  <select
                    value={newPaper.medium}
                    onChange={(e) => setNewPaper({ ...newPaper, medium: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  >
                    <option value="sinhala">Sinhala Medium</option>
                    <option value="english">English Medium</option>
                    <option value="tamil">Tamil Medium</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hasMarking"
                  checked={newPaper.hasMarkingScheme}
                  onChange={(e) => setNewPaper({ ...newPaper, hasMarkingScheme: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm"
                />
                <label htmlFor="hasMarking" className="font-semibold text-slate-700 cursor-pointer">
                  Include Faculty Verified Marking Scheme
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaperModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer"
                >
                  Publish Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
