import { LessonModule, LessonSession, VideoModule } from '../types';
import { supabase, isSupabaseConfigured, resolveR2Url } from '../lib/supabase';
import { supabaseService } from './supabaseService';
import { safeLocalStorageSet } from '../lib/storageUtils';

const STORAGE_KEY = 'inspire_lesson_modules';

export const MONTH_LIST = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const BATCH_LIST = [
  'A/L 2025',
  'A/L 2026',
  'A/L 2027',
  'A/L 2028'
];

export function sessionToVideoModule(session: LessonSession, lesson?: LessonModule): VideoModule {
  const resolvedUrl = session.videoUrl || (session.filePath ? resolveR2Url(session.filePath) : undefined);
  return {
    id: session.id,
    title: session.title,
    subtitle: lesson ? `${lesson.batch} · ${lesson.title}` : `${session.month} Session`,
    description: session.description || (lesson ? lesson.description : `Curriculum session on ${session.title}`),
    duration: session.duration || '1h 45m',
    date: session.created_at ? new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
    month: session.month,
    topic: lesson ? lesson.title : session.title,
    thumbnailGradient: 'from-blue-700 via-indigo-800 to-slate-900',
    chapters: [
      { title: `${session.title} - Core Theory`, time: '00:00' },
      { title: 'Structured Answer Analysis', time: '45:00' }
    ],
    notesSummary: [
      session.isFree ? 'Free Open Preview Session' : `Certified Syllabus Material · ${lesson?.batch || 'A/L'}`
    ],
    youtubeUrl: session.youtubeUrl,
    videoUrl: resolvedUrl,
    filePath: session.filePath,
    isFree: session.isFree,
    price: session.price || (lesson ? lesson.price : 0),
    lessonId: session.lessonId
  };
}

export const lessonService = {
  /**
   * Get all lessons from localStorage. If empty or in background, fetches from /api/lessons.
   */
  getLessons(): LessonModule[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse cached lessons:', err);
      }
    }
    // Asynchronously trigger server sync if not already done
    this.fetchLessons().catch(() => {});
    return [];
  },

  /**
   * Fetch lessons from server database (/api/lessons) and persist to local cache
   */
  async fetchLessons(): Promise<LessonModule[]> {
    try {
      const res = await fetch('/api/lessons');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.lessons)) {
          this.saveLessons(data.lessons);
          return data.lessons;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch lessons from server database:', err);
    }
    return this.getLessons();
  },

  /**
   * Save lessons to local storage and broadcast change event across application
   */
  saveLessons(lessons: LessonModule[]): void {
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(lessons));
    window.dispatchEvent(new CustomEvent('inspire-lessons-updated', { detail: lessons }));
  },

  /**
   * Synchronize Supabase courses & lessons into local lesson modules.
   * Also integrates real Recordings from Supabase & R2 Storage.
   */
  async syncWithSupabase(): Promise<LessonModule[]> {
    if (!isSupabaseConfigured) {
      return this.getLessons();
    }

    try {
      const [dbCourses, recordings] = await Promise.all([
        supabaseService.getCourses(),
        supabaseService.getRecordings()
      ]);

      const currentLessons = this.getLessons();
      const mergedLessons: LessonModule[] = [...currentLessons];

      if (dbCourses && dbCourses.length > 0) {
        dbCourses.forEach(c => {
          c.lessonsList.forEach(l => {
            const dbLessonId = `db-les-${l.id}`;
            const existingIdx = mergedLessons.findIndex(item => item.id === dbLessonId);

            const mappedSessions: LessonSession[] = (l.sessionsList || []).map(s => {
              // Extract month from session title (e.g. "[August] Session 1...")
              let detectedMonth = 'August';
              const monthMatch = s.title.match(/\[([A-Za-z]+)\]/);
              if (monthMatch && MONTH_LIST.includes(monthMatch[1])) {
                detectedMonth = monthMatch[1];
              } else if (c.exam_year) {
                detectedMonth = c.exam_year;
              }

              return {
                id: `db-ses-${s.id}`,
                lessonId: dbLessonId,
                title: s.title.replace(/\[([A-Za-z]+)\]\s*/, ''),
                month: detectedMonth,
                youtubeUrl: s.youtube_link || undefined,
                duration: '1h 45m',
                isFree: s.is_free,
                price: s.price,
                created_at: s.created_at,
                description: `Examination session on ${l.title}. Syllabus-verified instruction.`
              };
            });

            const lessonModuleObj: LessonModule = {
              id: dbLessonId,
              courseId: c.id,
              title: l.title,
              batch: `A/L ${c.exam_year || '2025'}`,
              description: `Official syllabus module for ${c.title}. Certified LKAS accounting standards.`,
              price: l.price || c.price || 3000,
              created_at: l.created_at,
              sessions: mappedSessions
            };

            if (existingIdx >= 0) {
              mergedLessons[existingIdx] = {
                ...mergedLessons[existingIdx],
                ...lessonModuleObj,
                sessions: [
                  ...mappedSessions,
                  ...mergedLessons[existingIdx].sessions.filter(ls => !ls.id.startsWith('db-ses-'))
                ]
              };
            } else {
              mergedLessons.push(lessonModuleObj);
            }
          });
        });
      }

      // If Recordings exist in R2 / Database, add them as an accessible recordings module
      if (recordings && recordings.length > 0) {
        const recordingLessonId = 'db-recordings-archive';
        const existingRecIdx = mergedLessons.findIndex(item => item.id === recordingLessonId);

        const recSessions: LessonSession[] = recordings.map((r, idx) => {
          const isFree = r.access_level === 'free' || Number(r.price) === 0;
          return {
            id: `db-rec-${r.id}`,
            lessonId: recordingLessonId,
            title: r.title,
            month: 'August',
            filePath: r.file_path,
            videoUrl: resolveR2Url(r.file_path),
            duration: '2h 00m',
            isFree,
            price: Number(r.price) || 0,
            created_at: r.created_at,
            description: `On-demand masterclass recording hosted on R2 cloud storage.`,
            orderIndex: idx + 1
          };
        });

        const recordingsModule: LessonModule = {
          id: recordingLessonId,
          title: 'Official Video Recordings Archive',
          batch: 'A/L Archive',
          description: 'Official recorded sessions and live replay archives directly from Inspire R2 Storage.',
          price: 0,
          created_at: new Date().toISOString(),
          sessions: recSessions
        };

        if (existingRecIdx >= 0) {
          mergedLessons[existingRecIdx] = recordingsModule;
        } else {
          mergedLessons.push(recordingsModule);
        }
      }

      this.saveLessons(mergedLessons);
      return mergedLessons;
    } catch (err) {
      console.warn('Error syncing lessons with Supabase:', err);
      return this.getLessons();
    }
  },

  /**
   * Create a new Lesson
   */
  async createLesson(data: {
    title: string;
    batch: string;
    description: string;
    price?: number;
  }): Promise<LessonModule> {
    let newId = `les-${Date.now()}`;
    let courseId: number | undefined;

    // Persist to Supabase if available
    if (isSupabaseConfigured) {
      try {
        // Look up or pick a course
        const { data: courses } = await supabase.from('courses').select('id, title, exam_year').limit(1);
        const targetCourseId = courses && courses.length > 0 ? courses[0].id : 1;

        const { data: createdDbLesson, error } = await supabase
          .from('lessons')
          .insert({
            course_id: targetCourseId,
            title: data.title,
            price: data.price || 0
          })
          .select()
          .single();

        if (!error && createdDbLesson) {
          newId = `db-les-${createdDbLesson.id}`;
          courseId = createdDbLesson.course_id;
        }
      } catch (err) {
        console.warn('Failed to insert lesson into Supabase directly:', err);
      }
    }

    const newLesson: LessonModule = {
      id: newId,
      courseId,
      title: data.title,
      batch: data.batch,
      description: data.description,
      price: data.price || 3000,
      created_at: new Date().toISOString(),
      sessions: []
    };

    const currentLessons = this.getLessons();
    const updated = [newLesson, ...currentLessons];
    this.saveLessons(updated);

    // Persist to server database (/api/lessons)
    try {
      fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-lesson', lesson: newLesson })
      }).catch(e => console.warn('Could not persist lesson to backend:', e));
    } catch {}

    return newLesson;
  },

  /**
   * Add a new Session to a Lesson with Month and YouTube link
   */
  async addSessionToLesson(data: {
    lessonId: string;
    title: string;
    month: string;
    youtubeUrl: string;
    duration?: string;
    isFree?: boolean;
    price?: number;
    description?: string;
  }): Promise<LessonSession> {
    let newSessionId = `ses-${Date.now()}`;

    // If lesson is linked to Supabase, insert into Supabase sessions table
    if (isSupabaseConfigured && data.lessonId.startsWith('db-les-')) {
      try {
        const numLessonId = parseInt(data.lessonId.replace('db-les-', ''), 10);
        const { data: createdDbSession, error } = await supabase
          .from('sessions')
          .insert({
            lesson_id: numLessonId,
            title: `[${data.month}] ${data.title}`,
            youtube_link: data.youtubeUrl || null,
            is_free: data.isFree !== undefined ? data.isFree : false,
            price: data.price || 0
          })
          .select()
          .single();

        if (!error && createdDbSession) {
          newSessionId = `db-ses-${createdDbSession.id}`;
        }
      } catch (err) {
        console.warn('Failed to insert session into Supabase:', err);
      }
    }

    const newSession: LessonSession = {
      id: newSessionId,
      lessonId: data.lessonId,
      title: data.title,
      month: data.month,
      youtubeUrl: data.youtubeUrl,
      duration: data.duration || '1h 45m',
      isFree: data.isFree !== undefined ? data.isFree : false,
      price: data.price || 0,
      description: data.description || '',
      created_at: new Date().toISOString()
    };

    const currentLessons = this.getLessons();
    const updated = currentLessons.map(les => {
      if (les.id === data.lessonId) {
        return {
          ...les,
          sessions: [...les.sessions, newSession]
        };
      }
      return les;
    });

    this.saveLessons(updated);

    // Persist session to server database (/api/lessons)
    try {
      fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-session', lessonId: data.lessonId, session: newSession })
      }).catch(e => console.warn('Could not persist session to backend:', e));
    } catch {}

    return newSession;
  },

  /**
   * Delete a session from a lesson
   */
  async deleteSession(lessonId: string, sessionId: string): Promise<void> {
    if (isSupabaseConfigured && sessionId.startsWith('db-ses-')) {
      try {
        const numId = parseInt(sessionId.replace('db-ses-', ''), 10);
        await supabase.from('sessions').delete().eq('id', numId);
      } catch (err) {
        console.warn('Error deleting session from Supabase:', err);
      }
    }

    const currentLessons = this.getLessons();
    const updated = currentLessons.map(les => {
      if (les.id === lessonId) {
        return {
          ...les,
          sessions: les.sessions.filter(s => s.id !== sessionId)
        };
      }
      return les;
    });
    this.saveLessons(updated);

    // Delete session in server database
    try {
      fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-session', lessonId, sessionId })
      }).catch(e => console.warn('Could not delete session on backend:', e));
    } catch {}
  },

  /**
   * Delete a lesson
   */
  async deleteLesson(lessonId: string): Promise<void> {
    if (isSupabaseConfigured && lessonId.startsWith('db-les-')) {
      try {
        const numId = parseInt(lessonId.replace('db-les-', ''), 10);
        await supabase.from('lessons').delete().eq('id', numId);
      } catch (err) {
        console.warn('Error deleting lesson from Supabase:', err);
      }
    }

    const currentLessons = this.getLessons();
    const updated = currentLessons.filter(les => les.id !== lessonId);
    this.saveLessons(updated);

    // Delete lesson in server database
    try {
      fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-lesson', lessonId })
      }).catch(e => console.warn('Could not delete lesson on backend:', e));
    } catch {}
  }
};

// Initial background sync with server database
if (typeof window !== 'undefined') {
  setTimeout(() => {
    lessonService.fetchLessons().catch(() => {});
  }, 100);
}

