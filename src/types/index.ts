export type ActiveTab = 'home' | 'lms' | 'past-papers' | 'videos' | 'live' | 'store' | 'results' | 'login' | 'admin';

export type PaymentType = 'bank_transfer' | 'physical_card';
export type SlipStatus = 'pending' | 'approved' | 'declined';

export interface PaymentSlip {
  id: string;
  userId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  paymentType: PaymentType;
  month: string;
  batch: string;
  amount: number;
  referenceNo?: string;
  slipImageUrl: string;
  status: SlipStatus;
  declineReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface StudentMonthlyAccess {
  id: string;
  userId: string;
  studentId: string;
  month: string;
  batch: string;
  isActive: boolean;
  unlockedAt: string;
}

export interface LiveClass {
  id: string;
  title: string;
  batch: string;
  month: string;
  scheduledAt: string;
  durationMinutes: number;
  zoomLink: string;
  zoomPasscode?: string;
  agenda?: string;
  isFree: boolean;
  status: 'upcoming' | 'live' | 'completed';
  createdAt?: string;
}

export interface GeneralSettings {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  paymentInstructions: string;
  contactWhatsApp: string;
}

export interface CategorizedMaterial {
  id: string;
  title: string;
  category: 'tute' | 'past_paper' | 'marking_scheme';
  batch: string;
  month: string;
  isFree: boolean;
  price: number;
  fileUrl: string;
  fileSize?: string;
  createdAt?: string;
}

export type Medium = 'sinhala' | 'english' | 'tamil';

export interface PastPaper {
  id: string;
  year: number;
  subject: string;
  medium: Medium;
  title: string;
  subtitle: string;
  pages: number;
  fileSize: string;
  hasMarkingScheme: boolean;
  downloadCount: number;
  category: 'Final Exam' | 'Mid-Term Assessment' | 'Mock Examination' | 'Model Paper' | 'Practical Theory';
  filePath?: string;
  fileUrl?: string;
  thumbnailPath?: string;
}

export interface LessonSession {
  id: string;
  lessonId: string;
  title: string;
  month: string; // e.g. "January", "February", ..., "September"
  youtubeUrl?: string;
  duration: string;
  isFree: boolean;
  orderIndex?: number;
  description?: string;
  created_at?: string;
  price?: number;
  filePath?: string;
  videoUrl?: string;
}

export interface LessonModule {
  id: string;
  title: string;
  batch: string; // e.g. "A/L 2025", "A/L 2026"
  courseId?: number;
  description: string;
  sessions: LessonSession[];
  created_at?: string;
  price?: number;
}

export interface VideoModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  date: string;
  month: string;
  topic: string;
  thumbnailGradient: string;
  isCompleted?: boolean;
  progressPercent?: number;
  chapters: { title: string; time: string }[];
  notesSummary: string[];
  youtubeUrl?: string;
  isFree?: boolean;
  price?: number;
  lessonId?: string;
  filePath?: string;
  videoUrl?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'Lesson Wise Tutes' | 'Revision Notes' | 'Past Paper Books' | 'Model Papers';
  batchTag: string; // e.g. "A/L 2025", "A/L 2024"
  isFree: boolean;
  priceLKR: number;
  priceUSD: number;
  format: 'Physical Book + PDF' | 'Downloadable PDF' | 'Full Kit';
  pageCount: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  filePath?: string;
  fileUrl?: string;
  thumbnailPath?: string;
}

export interface Lesson {
  id: string;
  lessonNumber: string;
  title: string;
  chapter: string;
  description: string;
  lastAccessed: string;
  durationMinutes: number;
  isCompleted: boolean;
  category: 'My Lessons' | 'Practical Sessions' | 'Tutes' | 'Past Papers';
  progress: number;
}

export interface Announcement {
  id: string;
  type: 'SCHEDULE CHANGE' | 'MOCK EXAM' | 'IMPORTANT NOTICE' | 'RESOURCE UPDATE';
  title: string;
  description: string;
  timeAgo: string;
  isUrgent?: boolean;
}

export interface StudentTask {
  id: string;
  title: string;
  courseCode: string;
  dueDate: string;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'normal';
}

export interface WallOfFameRanker {
  id: string;
  rank: number;
  name: string;
  achievement: string;
  year: number;
  school: string;
  district: string;
  zScore: string;
  quote: string;
  videoDuration: string;
  indexNo?: string;
  university?: string;
  subjects?: string;
}

export interface CartItem {
  material: StudyMaterial;
  quantity: number;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: 'Student' | 'Tutor' | 'Parent' | 'Admin';
  isAdmin?: boolean;
  indexNumber: string;
  batch: string;
  overallProgress: number;
  avatarUrl?: string;
  email: string;
  phone: string;
}

export interface EnrolledStudent {
  id: string;
  indexNumber: string;
  fullName: string;
  mobile: string;
  email: string;
  batch: string;
  institution: string;
  status: 'Verified' | 'Pending Approval' | 'Suspended';
  enrolledDate: string;
  modulesAccessible: number;
  maxDevices: number; // 1, 2, or 999 (Unlimited)
  isApproved: boolean;
  district?: string;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  studentMobile: string;
  itemsSummary: string;
  deliveryAddress: string;
  totalAmountLKR: number;
  paymentMethod: 'Bank Transfer' | 'Card Online' | 'Cash on Delivery';
  status: 'Processing' | 'Dispatched' | 'Delivered';
  orderDate: string;
}
