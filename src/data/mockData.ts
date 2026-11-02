import {
  PastPaper,
  VideoModule,
  StudyMaterial,
  Lesson,
  Announcement,
  StudentTask,
  WallOfFameRanker,
  CurrentUser,
  EnrolledStudent,
  StoreOrder,
  LessonModule
} from '../types';

/**
 * Initial empty user state. Authentic users authenticate via Supabase Auth.
 */
export const initialUser: CurrentUser | null = null;

/**
 * Real repository data loaded dynamically from Supabase database & Cloudflare R2 Storage.
 * Mock & dummy records have been removed.
 */
export const pastPapersData: PastPaper[] = [];

export const videoModulesData: VideoModule[] = [];

export const studyMaterialsData: StudyMaterial[] = [];

export const lessonsData: Lesson[] = [];

export const announcementsData: Announcement[] = [];

export const initialTasksData: StudentTask[] = [];

export const wallOfFameData: WallOfFameRanker[] = [];

export const courseDisciplines = [
  {
    title: 'Theory',
    badge: 'Core Curriculum',
    description: 'In-depth coverage of the entire syllabus from foundational principles to advanced corporate standards and consolidation methods.',
    highlights: ['Interactive Guided Sessions', 'Syllabus Handouts', 'Comprehensive Quizzes']
  },
  {
    title: 'Revision',
    badge: 'High-Yield Drill',
    description: 'Targeted review sessions focusing on high-yield topics, common student misconceptions, and exam strategies.',
    highlights: ['Fast-Paced Synthesis', 'LKAS Summary Flashcards', 'Time Management Techniques']
  },
  {
    title: 'Paper Class',
    badge: 'Simulated Exams',
    description: 'Rigorous practice with past papers and model questions under simulated exam conditions with individualized marking.',
    highlights: ['Timed Exam Sessions', 'Line-by-Line Marking Schemes', 'Evaluation Reports']
  },
  {
    title: 'Fast Track',
    badge: 'Sprint Program',
    description: 'Intensive crash course designed for final month preparation and rapid revision before the national examination.',
    highlights: ['Focused Review Sprint', 'Targeted Score Boosters', 'Direct Doubt Clearing']
  }
];

export const mockEnrolledStudents: EnrolledStudent[] = [];

export const mockStoreOrders: StoreOrder[] = [];

export const mockLessonsData: LessonModule[] = [];
