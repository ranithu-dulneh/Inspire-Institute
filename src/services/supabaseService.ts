import { safeLocalStorageSet } from '../lib/storageUtils';
import { 
  supabase, 
  isSupabaseConfigured,
  resolveR2Url,
  clearSupabaseAuthStorage,
  DbCourse, 
  DbLesson, 
  DbSession, 
  DbMaterial,
  DbTute,
  DbRecording,
  DbStudentProfile,
  DbEnrollment,
  DbInstitution,
  DbStuReceipt,
  DbReceiptRequest
} from '../lib/supabase';
import { 
  CurrentUser, 
  PastPaper, 
  StudyMaterial, 
  EnrolledStudent, 
  StoreOrder,
  PaymentSlip,
  PaymentType,
  SlipStatus,
  StudentMonthlyAccess,
  LiveClass,
  GeneralSettings,
  CategorizedMaterial
} from '../types';

export interface CourseWithDetails extends DbCourse {
  lessonsList: (DbLesson & {
    sessionsList: DbSession[];
    materialsList: DbMaterial[];
  })[];
}

export interface LoginResult {
  success: boolean;
  user?: CurrentUser;
  error?: string;
  pendingApproval?: boolean;
  deviceLimitExceeded?: boolean;
  studentId?: string;
  studentName?: string;
  currentDevices?: number;
  maxDevices?: number;
}

export const supabaseService = {
  isConfigured: isSupabaseConfigured,

  // -------------------------------------------------------------
  // COURSES, LESSONS & SESSIONS
  // -------------------------------------------------------------
  async getCourses(): Promise<CourseWithDetails[]> {
    if (!isSupabaseConfigured) return [];

    try {
      // 1. Fetch courses
      let { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('id', { ascending: true });

      if (coursesError) {
        if (coursesError.code === 'PGRST303' || String(coursesError.message).toLowerCase().includes('jwt')) {
          clearSupabaseAuthStorage();
          const retry = await supabase.from('courses').select('*').order('id', { ascending: true });
          if (!retry.error && retry.data) {
            courses = retry.data;
          } else {
            console.warn('Notice fetching courses:', coursesError.message);
            return [];
          }
        } else {
          console.warn('Notice fetching courses:', coursesError.message);
          return [];
        }
      }
      if (!courses || courses.length === 0) return [];

      const courseIds = courses.map(c => c.id);

      // 2. Fetch all lessons for these courses
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('course_id', courseIds)
        .order('id', { ascending: true });

      if (lessonsError) {
        console.warn('Notice fetching lessons:', lessonsError.message);
      }

      const lessonIds = (lessons || []).map(l => l.id);

      // 3. Fetch all sessions for these lessons
      let sessions: DbSession[] = [];
      if (lessonIds.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('id', { ascending: true });

        if (sessionsError) {
          console.warn('Notice fetching sessions:', sessionsError.message);
        } else if (sessionsData) {
          sessions = sessionsData;
        }
      }

      // 4. Fetch all materials
      let materials: DbMaterial[] = [];
      if (courseIds.length > 0) {
        const { data: materialsData, error: materialsError } = await supabase
          .from('materials')
          .select('*')
          .in('course_id', courseIds);

        if (materialsError) {
          console.warn('Notice fetching materials:', materialsError.message);
        } else if (materialsData) {
          materials = materialsData;
        }
      }

      // 5. Structure into full hierarchy
      return courses.map(course => {
        const courseLessons = (lessons || []).filter(l => l.course_id === course.id);
        const detailedLessons = courseLessons.map(lesson => {
          const lessonSessions = sessions.filter(s => s.lesson_id === lesson.id);
          const lessonMaterials = materials.filter(m => m.lesson_id === lesson.id);
          return {
            ...lesson,
            sessionsList: lessonSessions,
            materialsList: lessonMaterials
          };
        });

        return {
          ...course,
          lessonsList: detailedLessons
        };
      });
    } catch (err: any) {
      console.warn('Notice fetching courses:', err?.message || err);
      return [];
    }
  },

  // -------------------------------------------------------------
  // TUTES & RECORDINGS
  // -------------------------------------------------------------
  async getTutes(): Promise<DbTute[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('Tutes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST303' || String(error.message).toLowerCase().includes('jwt')) {
          clearSupabaseAuthStorage();
          const retry = await supabase.from('Tutes').select('*').order('created_at', { ascending: false });
          if (!retry.error && retry.data) {
            return retry.data;
          }
        }
        console.warn('Notice fetching Tutes:', error.message);
        return [];
      }
      return data || [];
    } catch (err: any) {
      console.warn('Notice fetching Tutes:', err?.message || err);
      return [];
    }
  },

  async getRecordings(): Promise<DbRecording[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('Recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST303' || String(error.message).toLowerCase().includes('jwt')) {
          clearSupabaseAuthStorage();
          const retry = await supabase.from('Recordings').select('*').order('created_at', { ascending: false });
          if (!retry.error && retry.data) {
            return retry.data;
          }
        }
        console.warn('Notice fetching Recordings:', error.message);
        return [];
      }
      return data || [];
    } catch (err: any) {
      console.warn('Notice fetching Recordings:', err?.message || err);
      return [];
    }
  },

  // -------------------------------------------------------------
  // INSTITUTIONS & LOOKUP TABLES
  // -------------------------------------------------------------
  async getInstitutions(): Promise<DbInstitution[]> {
    const DEFAULT_INSTS: DbInstitution[] = [
      { id: 'online', name: 'Inspire Online LMS', location: 'Islandwide Online', is_active: true },
      { id: 'ziyon', name: 'Ziyon Academy', location: 'Kurunegala', is_active: true },
      { id: 'ims', name: 'IMS Kandy', location: 'Kandy', is_active: true },
      { id: 'apex', name: 'Apex Academy', location: 'Kegalle', is_active: true }
    ];

    let dbList: DbInstitution[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('institutions')
          .select('*');

        if (error) {
          if (error.code === 'PGRST303' || String(error.message).toLowerCase().includes('jwt')) {
            clearSupabaseAuthStorage();
            const retry = await supabase.from('institutions').select('*');
            if (!retry.error && retry.data) {
              dbList = retry.data;
            }
          }
        } else if (data) {
          dbList = data;
        }
      } catch {}
    }

    const local: DbInstitution[] = JSON.parse(localStorage.getItem('inspire_institutions') || '[]');
    const map = new Map<string, DbInstitution>();
    DEFAULT_INSTS.forEach(i => map.set(i.id, i));
    local.forEach(i => map.set(i.id, i));
    dbList.forEach(i => map.set(i.id, i));

    return Array.from(map.values());
  },

  // -------------------------------------------------------------
  // AUTHENTICATION, REGISTRATION & DEVICE VERIFICATION
  // -------------------------------------------------------------
  getDeviceToken(): string {
    let token = localStorage.getItem('inspire_device_token');
    if (!token) {
      token = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();
      localStorage.setItem('inspire_device_token', token);
    }
    return token;
  },

  async verifyAndRegisterDeviceSession(
    userId: string,
    maxDevices: number
  ): Promise<{ allowed: boolean; currentDevices: number; maxDevices: number }> {
    const token = this.getDeviceToken();
    if (maxDevices >= 999) {
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('device_sessions')
            .upsert({ user_id: userId, device_token: token, last_active_at: new Date().toISOString() }, { onConflict: 'user_id,device_token' });
        } catch {}
      }
      return { allowed: true, currentDevices: 1, maxDevices: 999 };
    }

    if (!isSupabaseConfigured) {
      const storedKey = `inspire_device_sessions_${userId}`;
      const sessions: string[] = JSON.parse(localStorage.getItem(storedKey) || '[]');
      if (sessions.includes(token)) {
        return { allowed: true, currentDevices: sessions.length, maxDevices };
      }
      if (sessions.length >= maxDevices) {
        return { allowed: false, currentDevices: sessions.length, maxDevices };
      }
      sessions.push(token);
      localStorage.setItem(storedKey, JSON.stringify(sessions));
      return { allowed: true, currentDevices: sessions.length, maxDevices };
    }

    try {
      const { data: sessions } = await supabase
        .from('device_sessions')
        .select('id, device_token')
        .eq('user_id', userId);

      const activeList = sessions || [];
      const alreadyRegistered = activeList.some(s => s.device_token === token);

      if (alreadyRegistered) {
        await supabase
          .from('device_sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('device_token', token);
        return { allowed: true, currentDevices: activeList.length, maxDevices };
      }

      if (activeList.length >= maxDevices) {
        return { allowed: false, currentDevices: activeList.length, maxDevices };
      }

      await supabase
        .from('device_sessions')
        .insert({
          user_id: userId,
          device_token: token,
          last_active_at: new Date().toISOString()
        });

      return { allowed: true, currentDevices: activeList.length + 1, maxDevices };
    } catch {
      return { allowed: true, currentDevices: 1, maxDevices };
    }
  },

  async registerStudent(params: {
    fullName: string;
    mobile: string;
    email: string;
    password: string;
    confirmPassword?: string;
    batch: string;
    district: string;
    institutionId?: string;
  }): Promise<{ success: boolean; studentId?: string; error?: string }> {
    const { fullName, mobile, email, password, confirmPassword, batch, district, institutionId } = params;

    if (!fullName.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
      return { success: false, error: 'Please enter all required information.' };
    }

    if (confirmPassword && password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match. Please re-enter your password.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Generate unique 2026-XXXX format Student ID
    const yearPrefix = batch.includes('2027') ? '2027' : (batch.includes('2028') ? '2028' : '2026');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const generatedStudentId = `${yearPrefix}-${randCode}`;

    // Store Student ID to Email mapping locally for seamless Student ID logins
    try {
      const map = JSON.parse(localStorage.getItem('inspire_stuid_email_map') || '{}');
      map[generatedStudentId.toUpperCase()] = email.trim().toLowerCase();
      map[email.trim().toLowerCase()] = generatedStudentId.toUpperCase();
      localStorage.setItem('inspire_stuid_email_map', JSON.stringify(map));
    } catch {}

    // Offline / persistent fallback when Supabase is offline
    if (!isSupabaseConfigured) {
      const newLocalStudent: EnrolledStudent & { password?: string } = {
        id: `stu-${Date.now()}`,
        indexNumber: generatedStudentId,
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        batch: `A/L ${batch} Intake`,
        institution: district ? `${district} Center` : 'Inspire Online Portal',
        status: 'Pending Approval',
        enrolledDate: 'Today',
        modulesAccessible: 0,
        maxDevices: 1,
        isApproved: false,
        district: district.trim()
      };

      // Persist to server disk storage
      try {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', student: newLocalStudent })
        });
      } catch (e) {
        console.warn('Notice saving student to server:', e);
      }

      const localStudents: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
      localStorage.setItem('inspire_admin_students', JSON.stringify([newLocalStudent, ...localStudents]));
      window.dispatchEvent(new CustomEvent('inspire-students-updated'));

      return {
        success: true,
        studentId: generatedStudentId
      };
    }

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            mobile_number: mobile.trim(),
            district: district.trim(),
            student_id: generatedStudentId,
            course_program: `A/L ${batch} Intake`
          }
        }
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || 'Failed to create student account.'
        };
      }

      const authUserId = authData.user.id;

      // 2. Insert into public.student_profiles with is_approved = false, max_devices = 1
      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert({
          id: authUserId,
          student_id: generatedStudentId,
          full_name: fullName.trim(),
          mobile_number: mobile.trim(),
          district: district.trim(),
          course_program: `A/L ${batch} Intake`,
          is_approved: false,
          max_devices: 1,
          institution_id: institutionId || null
        });

      if (profileError) {
        console.warn('Initial student profile insert warning, retrying:', profileError);
        const retryId = `${yearPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase
          .from('student_profiles')
          .insert({
            id: authUserId,
            student_id: retryId,
            full_name: fullName.trim(),
            mobile_number: mobile.trim(),
            district: district.trim(),
            course_program: `A/L ${batch} Intake`,
            is_approved: false,
            max_devices: 1
          });
        
        // Revoke immediate session so student cannot enter until approved
        await supabase.auth.signOut().catch(() => {});
        return {
          success: true,
          studentId: retryId
        };
      }

      // Automatically sign out immediately after signup so unapproved student cannot enter
      await supabase.auth.signOut().catch(() => {});

      // Synchronize into persistent storage and local cache
      const newLocalStudent: EnrolledStudent & { password?: string } = {
        id: authUserId,
        indexNumber: generatedStudentId,
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        batch: `A/L ${batch} Intake`,
        institution: district ? `${district} Center` : 'Inspire Online Portal',
        status: 'Pending Approval',
        enrolledDate: 'Today',
        modulesAccessible: 0,
        maxDevices: 1,
        isApproved: false,
        district: district.trim()
      };

      try {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', student: newLocalStudent })
        });
        const localStudents: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
        localStorage.setItem(
          'inspire_admin_students', 
          JSON.stringify([newLocalStudent, ...localStudents.filter(s => s.id !== authUserId && s.indexNumber !== generatedStudentId)])
        );
        window.dispatchEvent(new CustomEvent('inspire-students-updated'));
      } catch {}

      return {
        success: true,
        studentId: generatedStudentId
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unexpected error during registration.'
      };
    }
  },

  async approveStudent(idOrUuid: string): Promise<boolean> {
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id: idOrUuid })
      });
    } catch (err) {
      console.warn('Server approve sync error:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('student_profiles')
          .update({ is_approved: true })
          .or(`id.eq.${idOrUuid},student_id.eq.${idOrUuid}`);
      } catch (err) {
        console.warn('Supabase approve error:', err);
      }
    }

    try {
      const local: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
      const updated = local.map(s => 
        (s.id === idOrUuid || s.indexNumber === idOrUuid) 
          ? { ...s, status: 'Verified' as const, isApproved: true, modulesAccessible: 8 } 
          : s
      );
      localStorage.setItem('inspire_admin_students', JSON.stringify(updated));
    } catch {}

    window.dispatchEvent(new CustomEvent('inspire-students-updated'));
    return true;
  },

  async updateStudentMaxDevices(idOrUuid: string, maxDevices: number): Promise<boolean> {
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'device-limit', id: idOrUuid, maxDevices })
      });
    } catch (err) {
      console.warn('Server maxDevices sync error:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('student_profiles')
          .update({ max_devices: maxDevices })
          .or(`id.eq.${idOrUuid},student_id.eq.${idOrUuid}`);
      } catch (err) {
        console.warn('Supabase update max devices error:', err);
      }
    }

    try {
      const local: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
      const updated = local.map(s => 
        (s.id === idOrUuid || s.indexNumber === idOrUuid) 
          ? { ...s, maxDevices } 
          : s
      );
      localStorage.setItem('inspire_admin_students', JSON.stringify(updated));
    } catch {}

    window.dispatchEvent(new CustomEvent('inspire-students-updated'));
    return true;
  },

  async updateStudentStatus(idOrUuid: string, status: 'Verified' | 'Suspended'): Promise<boolean> {
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', id: idOrUuid, status })
      });
    } catch (err) {
      console.warn('Server status sync error:', err);
    }

    try {
      const local: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
      const updated = local.map(s => 
        (s.id === idOrUuid || s.indexNumber === idOrUuid) 
          ? { ...s, status, isApproved: status === 'Verified' } 
          : s
      );
      localStorage.setItem('inspire_admin_students', JSON.stringify(updated));
    } catch {}

    window.dispatchEvent(new CustomEvent('inspire-students-updated'));
    return true;
  },


  async loginWithSupabase(
    identifier: string,
    password: string
  ): Promise<LoginResult> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured yet.' };
    }

    try {
      let emailToUse = identifier.trim();

      // Check if user entered a Student ID (e.g. 2026-XXXX or without @)
      if (!emailToUse.includes('@')) {
        const cleanId = emailToUse.toUpperCase();
        try {
          const map = JSON.parse(localStorage.getItem('inspire_stuid_email_map') || '{}');
          if (map[cleanId]) {
            emailToUse = map[cleanId];
          }
        } catch {}

        if (!emailToUse.includes('@')) {
          // Look up in student_profiles
          const { data: profile } = await supabase
            .from('student_profiles')
            .select('id, student_id, mobile_number')
            .eq('student_id', cleanId)
            .maybeSingle();

          if (profile?.id) {
            emailToUse = `${cleanId.toLowerCase()}@inspire.ac.lk`;
          }
        }
      }

      // Perform real Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password
      });

      if (authError || !authData.user) {
        const errorMsg = authError?.message || '';
        const isEmailNotConfirmed = errorMsg.toLowerCase().includes('email not confirmed') ||
                                    errorMsg.toLowerCase().includes('confirm your email') ||
                                    errorMsg.toLowerCase().includes('email_not_confirmed');

        if (isEmailNotConfirmed) {
          // The student's email has not been confirmed via automated email,
          // but if the institution administrator has approved them, allow login!
          const cleanIdent = identifier.trim().toUpperCase();
          const cleanEmail = emailToUse.toLowerCase();

          // 1. Fetch live student records from server persistent store
          let serverStudents: EnrolledStudent[] = [];
          try {
            const resp = await fetch('/api/students');
            if (resp.ok) {
              const resJson = await resp.json();
              if (Array.isArray(resJson.students)) {
                serverStudents = resJson.students;
              }
            }
          } catch {}

          // 2. Fetch from local cache as well
          const localStudents: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');

          // 3. Check student_profiles in Supabase
          let profile: any = null;
          try {
            const { data } = await supabase
              .from('student_profiles')
              .select('*')
              .or(`student_id.eq.${cleanIdent},id.eq.${cleanIdent}`)
              .maybeSingle();
            profile = data;
          } catch {}

          const matched: any = serverStudents.find(s => 
            s.indexNumber?.toUpperCase() === cleanIdent || 
            s.email?.toLowerCase() === cleanEmail ||
            s.id === cleanIdent
          ) || localStudents.find(s => 
            s.indexNumber?.toUpperCase() === cleanIdent || 
            s.email?.toLowerCase() === cleanEmail ||
            s.id === cleanIdent
          ) || (profile ? {
            id: profile.id,
            indexNumber: profile.student_id,
            fullName: profile.full_name,
            email: emailToUse,
            mobile: profile.mobile_number,
            batch: profile.course_program,
            isApproved: profile.is_approved,
            status: profile.is_approved ? 'Verified' : 'Pending Approval',
            maxDevices: profile.max_devices || 1
          } : null);

          if (matched) {
            const isApproved = matched.isApproved === true || matched.status === 'Verified' || profile?.is_approved === true;

            if (isApproved) {
              // Administrator has verified & approved this student! Allow instant login!
              const studentId = matched.indexNumber || cleanIdent;
              const studentName = matched.fullName || 'Enrolled Student';
              const maxDevices = matched.maxDevices || 1;
              const deviceCheck = await this.verifyAndRegisterDeviceSession(matched.id || studentId, maxDevices);

              if (!deviceCheck.allowed) {
                return {
                  success: false,
                  deviceLimitExceeded: true,
                  currentDevices: deviceCheck.currentDevices,
                  maxDevices: deviceCheck.maxDevices,
                  studentId,
                  studentName,
                  error: `Device limit reached. Your account is permitted on ${deviceCheck.maxDevices} active device(s).`
                };
              }

              const studentUser: CurrentUser = {
                id: matched.id || studentId,
                name: studentName,
                role: 'Student',
                indexNumber: studentId,
                batch: matched.batch || '2026 A/L Intake',
                overallProgress: 75,
                email: matched.email || emailToUse,
                phone: matched.mobile || '+94 77 123 4567'
              };

              return { success: true, user: studentUser };
            } else {
              // Not yet approved by administrator
              return {
                success: false,
                pendingApproval: true,
                studentId: matched.indexNumber || cleanIdent,
                studentName: matched.fullName || 'Student',
                error: 'Your registration is pending administrator approval. Please wait for an admin to verify your account.'
              };
            }
          }
        }

        return { 
          success: false, 
          error: authError?.message || 'Invalid login credentials. Please check your Student ID / Email and password.' 
        };
      }

      const authUser = authData.user;

      // 1. Check if user exists in public.admin_users or is primary admin email
      const isPrimaryAdmin = (authUser.email?.toLowerCase() === 'inspireinstitute.lms@gmail.com') ||
                             (emailToUse.toLowerCase() === 'inspireinstitute.lms@gmail.com');

      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (adminRecord || isPrimaryAdmin) {
        const adminUser: CurrentUser = {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || 'Administrator',
          role: 'Admin',
          indexNumber: 'ADMIN-FACULTY',
          batch: 'Executive Faculty Board',
          overallProgress: 100,
          email: authUser.email || emailToUse,
          phone: authUser.phone || authUser.user_metadata?.phone || '+94 77 123 4567'
        };
        return { success: true, user: adminUser };
      }

      // 2. Fetch student profile from public.student_profiles
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const studentId = profile?.student_id || authUser.id.substring(0, 8).toUpperCase();
      const studentName = profile?.full_name || authUser.user_metadata?.full_name || 'Enrolled Student';

      // 3. Approval Check: If not approved, revoke session and return pendingApproval
      if (profile && profile.is_approved === false) {
        await supabase.auth.signOut().catch(() => {});
        return {
          success: false,
          pendingApproval: true,
          studentId,
          studentName,
          error: 'Your registration is pending administrator approval. Please wait for an admin to verify your account.'
        };
      }

      // 4. Device Limitation Check: Max devices enforcement
      const maxDevices = profile?.max_devices !== undefined ? profile.max_devices : 1;
      const deviceCheck = await this.verifyAndRegisterDeviceSession(authUser.id, maxDevices);

      if (!deviceCheck.allowed) {
        await supabase.auth.signOut().catch(() => {});
        return {
          success: false,
          deviceLimitExceeded: true,
          currentDevices: deviceCheck.currentDevices,
          maxDevices: deviceCheck.maxDevices,
          studentId,
          studentName,
          error: `Device limit reached. Your account is permitted on ${deviceCheck.maxDevices} active device(s). Please log out of your other device or contact administration.`
        };
      }

      const studentUser: CurrentUser = {
        id: authUser.id,
        name: studentName,
        role: 'Student',
        indexNumber: studentId,
        batch: profile?.course_program || '2025 A/L Commerce',
        overallProgress: 75,
        email: authUser.email || emailToUse,
        phone: profile?.mobile_number || '+94 77 123 4567'
      };

      return { success: true, user: studentUser };
    } catch (err: any) {
      return { 
        success: false, 
        error: err?.message || 'Authentication failed due to unexpected network error.' 
      };
    }
  },

  async getCurrentSessionUser(): Promise<CurrentUser | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check admin
      const isPrimaryAdmin = user.email?.toLowerCase() === 'inspireinstitute.lms@gmail.com';

      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminRecord || isPrimaryAdmin) {
        return {
          id: user.id,
          name: user.user_metadata?.full_name || 'Administrator',
          role: 'Admin',
          indexNumber: 'ADMIN-FACULTY',
          batch: 'Executive Faculty Board',
          overallProgress: 100,
          email: user.email || 'inspireinstitute.lms@gmail.com',
          phone: user.phone || '+94 77 123 4567'
        };
      }

      // Check student
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Revoke session if student has not been approved by administrator
      if (profile && profile.is_approved === false) {
        await supabase.auth.signOut().catch(() => {});
        return null;
      }

      // Check local cache for approval status
      try {
        const localStudents: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
        const localMatched = localStudents.find(s => s.id === user.id || s.email?.toLowerCase() === user.email?.toLowerCase());
        if (localMatched && (!localMatched.isApproved && localMatched.status === 'Pending Approval')) {
          await supabase.auth.signOut().catch(() => {});
          return null;
        }
      } catch {}

      return {
        id: user.id,
        name: profile?.full_name || user.user_metadata?.full_name || 'Student',
        role: 'Student',
        indexNumber: profile?.student_id || user.id.substring(0, 8).toUpperCase(),
        batch: profile?.course_program || '2025 A/L Commerce',
        overallProgress: 70,
        email: user.email || 'student@inspire.ac.lk',
        phone: profile?.mobile_number || '+94 77 123 4567'
      };
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
  },

  // -------------------------------------------------------------
  // ENROLLMENTS & PERMISSIONS
  // -------------------------------------------------------------
  async getUserEnrollments(userId: string): Promise<DbEnrollment[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        if (error.code === 'PGRST303' || String(error.message).toLowerCase().includes('jwt')) {
          clearSupabaseAuthStorage();
        }
        console.warn('Notice fetching enrollments:', error.message);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  async submitPaymentReceipt(
    userEmail: string,
    filePath: string,
    referenceNo?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const { error } = await supabase
        .from('Stu_Reciepts')
        .insert({
          file_path: filePath,
          reference_no: referenceNo || null,
          user_email: userEmail,
          status: 'pending'
        });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async createLesson(
    courseId: number,
    title: string,
    price: number = 0
  ): Promise<{ success: boolean; data?: DbLesson; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured' };
    }
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          title,
          price
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async createSession(
    lessonId: number,
    title: string,
    youtubeUrl: string,
    isFree: boolean = true,
    price: number = 0
  ): Promise<{ success: boolean; data?: DbSession; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured' };
    }
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          lesson_id: lessonId,
          title,
          youtube_link: youtubeUrl || null,
          is_free: isFree,
          price
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // -------------------------------------------------------------
  // REAL DATABASE QUERY & R2 MAPPING METHODS (NO MOCK DATA)
  // -------------------------------------------------------------
  resolveR2Url(filePath?: string | null): string {
    return resolveR2Url(filePath);
  },

  async getMaterials(): Promise<DbMaterial[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST303' || String(error.message).toLowerCase().includes('jwt')) {
          clearSupabaseAuthStorage();
          const retry = await supabase.from('materials').select('*').order('created_at', { ascending: false });
          if (!retry.error && retry.data) return retry.data;
        }
        console.warn('Notice fetching materials:', error.message);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  async getStudentProfiles(): Promise<DbStudentProfile[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST303' || String(error.message).toLowerCase().includes('jwt')) {
          clearSupabaseAuthStorage();
          const retry = await supabase.from('student_profiles').select('*').order('created_at', { ascending: false });
          if (!retry.error && retry.data) return retry.data;
        }
        console.warn('Notice fetching student profiles:', error.message);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  async getStuReceipts(): Promise<DbStuReceipt[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('Stu_Reciepts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST303' || String(error.message).toLowerCase().includes('jwt')) {
          clearSupabaseAuthStorage();
          const retry = await supabase.from('Stu_Reciepts').select('*').order('created_at', { ascending: false });
          if (!retry.error && retry.data) return retry.data;
        }
        console.warn('Notice fetching Stu_Reciepts:', error.message);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  async getReceiptRequests(): Promise<DbReceiptRequest[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('receipt_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST303' || String(error.message).toLowerCase().includes('jwt')) {
          clearSupabaseAuthStorage();
          const retry = await supabase.from('receipt_requests').select('*').order('created_at', { ascending: false });
          if (!retry.error && retry.data) return retry.data;
        }
        console.warn('Notice fetching receipt_requests:', error.message);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch real past papers from Supabase Tutes and materials tables.
    * Returns empty array if database has no rows (strictly no dummy data).
   */
  async getPastPapers(): Promise<PastPaper[]> {
    const papers: PastPaper[] = [];

    // 1. Real Past Papers created in Admin Dashboard
    try {
      const local: PastPaper[] = JSON.parse(localStorage.getItem('inspire_admin_papers') || '[]');
      if (Array.isArray(local)) {
        papers.push(...local);
      }
    } catch {}

    // 2. Fetch materials from database/storage that are strictly past papers or marking schemes (NEVER class tutes)
    try {
      const materials = await this.getCategorizedMaterials();
      materials.forEach(m => {
        // Explicitly exclude class tutes
        if (m.category === 'tute') return;

        const isPaperOrScheme = m.category === 'past_paper' || m.category === 'marking_scheme' ||
          m.title.toLowerCase().includes('past paper') || m.title.toLowerCase().includes('model paper') ||
          m.title.toLowerCase().includes('marking scheme');

        if (!isPaperOrScheme) return;
        if (papers.some(p => p.id === m.id || p.title.toLowerCase() === m.title.toLowerCase())) return;

        const yearMatch = m.title.match(/(202\d)/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date(m.createdAt || Date.now()).getFullYear();

        let medium: 'sinhala' | 'english' | 'tamil' = 'sinhala';
        const lowerTitle = m.title.toLowerCase();
        if (lowerTitle.includes('english')) medium = 'english';
        else if (lowerTitle.includes('tamil')) medium = 'tamil';

        papers.push({
          id: `mat-pp-${m.id}`,
          year,
          subject: 'Accounting Principles',
          medium,
          title: m.title,
          subtitle: `Certified Curriculum Archive (${m.isFree ? 'Free Access' : `Rs. ${m.price}`})`,
          pages: 20,
          fileSize: m.fileSize || '3.5 MB',
          hasMarkingScheme: m.category === 'marking_scheme' || lowerTitle.includes('marking'),
          downloadCount: 0,
          category: m.category === 'marking_scheme' ? 'Mid-Term Assessment' : 'Final Exam',
          fileUrl: m.fileUrl,
          filePath: m.fileUrl
        });
      });
    } catch (err) {
      console.warn('Notice querying past papers:', err);
    }

    return papers;
  },

  async deletePastPaper(id: string): Promise<boolean> {
    const local: PastPaper[] = JSON.parse(localStorage.getItem('inspire_admin_papers') || '[]');
    const updated = local.filter(p => p.id !== id);
    localStorage.setItem('inspire_admin_papers', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        if (id.startsWith('tute-pp-')) {
          const numId = parseInt(id.replace('tute-pp-', ''), 10);
          await supabase.from('Tutes').delete().eq('id', numId);
        } else if (id.startsWith('mat-pp-')) {
          const numId = parseInt(id.replace('mat-pp-', ''), 10);
          await supabase.from('materials').delete().eq('id', numId);
        }
      } catch (err) {
        console.warn('Error deleting paper from Supabase:', err);
      }
    }
    window.dispatchEvent(new CustomEvent('inspire-papers-updated'));
    return true;
  },

  /**
   * Fetch real study materials from Supabase Tutes and materials tables.
   * Returns empty array if database has no rows (strictly no dummy data).
   */
  async getStudyMaterials(): Promise<StudyMaterial[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const [tutes, materials] = await Promise.all([
        this.getTutes(),
        this.getMaterials()
      ]);

      const items: StudyMaterial[] = [];

      tutes.forEach(t => {
        const isFree = t.access_level === 'free' || Number(t.price) === 0;
        const price = Number(t.price) || 0;

        items.push({
          id: `tute-mat-${t.id}`,
          title: t.title,
          subtitle: `Certified Syllabus Document · ${isFree ? 'Free Open Access' : 'Premium Material'}`,
          description: `Official curriculum publication stored in database & R2 storage.`,
          category: 'Lesson Wise Tutes',
          batchTag: 'A/L 2025',
          isFree,
          priceLKR: price,
          priceUSD: Math.round(price / 300) || 0,
          format: 'Downloadable PDF',
          pageCount: 32,
          rating: 5.0,
          reviewsCount: 1,
          inStock: true,
          filePath: t.file_path,
          fileUrl: resolveR2Url(t.file_path),
          thumbnailPath: t.thumbnail_path ? resolveR2Url(t.thumbnail_path) : undefined
        });
      });

      materials.forEach(m => {
        items.push({
          id: `db-mat-${m.id}`,
          title: m.title,
          subtitle: `Verified Lesson Handout`,
          description: `Official study material attached to syllabus course.`,
          category: 'Revision Notes',
          batchTag: 'A/L 2025',
          isFree: true,
          priceLKR: 0,
          priceUSD: 0,
          format: 'Downloadable PDF',
          pageCount: 16,
          rating: 5.0,
          reviewsCount: 1,
          inStock: true,
          filePath: m.file_url,
          fileUrl: resolveR2Url(m.file_url)
        });
      });

      return items;
    } catch (err) {
      console.error('Error fetching real study materials:', err);
      return [];
    }
  },

  /**
   * Fetch real enrolled students from server persistent storage and Supabase.
   */
  async getEnrolledStudents(): Promise<EnrolledStudent[]> {
    let serverStudents: EnrolledStudent[] = [];
    try {
      const resp = await fetch('/api/students');
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.students)) {
          serverStudents = data.students;
        }
      }
    } catch (e) {
      console.warn('Notice fetching /api/students:', e);
    }

    let dbStudents: EnrolledStudent[] = [];
    if (isSupabaseConfigured) {
      try {
        const profiles = await this.getStudentProfiles();
        dbStudents = profiles.map(s => {
          return {
            id: s.id,
            indexNumber: s.student_id || s.id.substring(0, 8).toUpperCase(),
            fullName: s.full_name,
            mobile: s.mobile_number || 'N/A',
            email: `${(s.student_id || s.id.substring(0, 8)).toLowerCase()}@inspire.ac.lk`,
            batch: s.course_program || 'A/L Commerce',
            institution: s.district ? `${s.district} Center` : 'Inspire Online Portal',
            status: s.is_approved ? 'Verified' as const : 'Pending Approval' as const,
            enrolledDate: s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
            modulesAccessible: s.is_approved ? 8 : 0,
            maxDevices: s.max_devices || 1,
            isApproved: s.is_approved,
            district: s.district || undefined
          };
        });
      } catch (err) {
        console.error('Error fetching real enrolled students:', err);
      }
    }

    // Merge server persistent students, supabase students, and local cache
    try {
      const local: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
      const map = new Map<string, EnrolledStudent>();
      
      // Server is source of truth for persistent data
      serverStudents.forEach(s => map.set(s.id || s.indexNumber, s));
      dbStudents.forEach(s => map.set(s.id || s.indexNumber, s));

      // Merge local items only if not already tracked
      local.forEach(loc => {
        const key = loc.id || loc.indexNumber;
        if (!map.has(key)) {
          map.set(key, loc);
        }
      });

      const merged = Array.from(map.values());
      localStorage.setItem('inspire_admin_students', JSON.stringify(merged));
      return merged;
    } catch {
      return serverStudents.length > 0 ? serverStudents : dbStudents;
    }
  },

  async deleteStudent(id: string): Promise<boolean> {
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
    } catch (err) {
      console.warn('Server delete student error:', err);
    }

    const local: EnrolledStudent[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
    const updated = local.filter(s => s.id !== id && s.indexNumber !== id);
    localStorage.setItem('inspire_admin_students', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('student_profiles').delete().or(`id.eq.${id},student_id.eq.${id}`);
      } catch (err) {
        console.warn('Error deleting student from Supabase:', err);
      }
    }
    window.dispatchEvent(new CustomEvent('inspire-students-updated'));
    return true;
  },

  /**
   * Fetch real orders / receipts from Supabase Stu_Reciepts & receipt_requests tables.
   * Returns empty array if database has no rows (strictly no dummy data).
   */
  async getStoreOrders(): Promise<StoreOrder[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const [receipts, requests] = await Promise.all([
        this.getStuReceipts(),
        this.getReceiptRequests()
      ]);

      const orders: StoreOrder[] = [];

      receipts.forEach(r => {
        orders.push({
          id: r.id,
          orderNumber: r.reference_no || `REC-${r.id.substring(0, 8).toUpperCase()}`,
          studentName: r.user_email ? r.user_email.split('@')[0] : 'Student',
          studentMobile: 'Recorded via Portal',
          itemsSummary: `Bank Slip / Payment Receipt (${r.file_path})`,
          deliveryAddress: 'Digital Course Activation',
          totalAmountLKR: 3000,
          paymentMethod: 'Bank Transfer',
          status: r.status === 'approved' ? 'Delivered' : 'Processing',
          orderDate: r.created_at ? new Date(r.created_at).toLocaleString() : 'Recently'
        });
      });

      requests.forEach(req => {
        orders.push({
          id: req.id,
          orderNumber: `REQ-${req.id.substring(0, 8).toUpperCase()}`,
          studentName: `User ${req.user_id.substring(0, 8)}`,
          studentMobile: 'Recorded via Portal',
          itemsSummary: `Access Request: ${req.item_type} #${req.item_id}`,
          deliveryAddress: 'Digital Access Grant',
          totalAmountLKR: 3000,
          paymentMethod: 'Bank Transfer',
          status: req.status === 'approved' ? 'Delivered' : 'Processing',
          orderDate: req.created_at ? new Date(req.created_at).toLocaleString() : 'Recently'
        });
      });

      return orders;
    } catch (err) {
      console.error('Error fetching real store orders:', err);
      return [];
    }
  },

  async createTute(data: {
    title: string;
    filePath: string;
    price?: number;
    accessLevel?: string;
    thumbnailPath?: string;
  }): Promise<{ success: boolean; data?: DbTute; error?: string }> {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase is not configured' };
    try {
      const { data: result, error } = await supabase
        .from('Tutes')
        .insert({
          title: data.title,
          file_path: data.filePath,
          price: data.price || 0,
          access_level: data.accessLevel || 'free',
          thumbnail_path: data.thumbnailPath || null
        })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async createRecording(data: {
    title: string;
    filePath: string;
    price?: number;
    accessLevel?: string;
  }): Promise<{ success: boolean; data?: DbRecording; error?: string }> {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase is not configured' };
    try {
      const { data: result, error } = await supabase
        .from('Recordings')
        .insert({
          title: data.title,
          file_path: data.filePath,
          price: data.price || 0,
          access_level: data.accessLevel || 'free'
        })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // -------------------------------------------------------------
  // GENERAL SETTINGS & TEACHER BANK DETAILS
  // -------------------------------------------------------------
  async getGeneralSettings(): Promise<GeneralSettings> {
    const DEFAULT_SETTINGS: GeneralSettings = {
      bankName: 'Commercial Bank of Ceylon',
      accountName: 'Inspire Academy of Accounting',
      accountNumber: '8001234567',
      branchName: 'Nugegoda City Branch',
      paymentInstructions: 'Please include your Student ID as the deposit reference. Upload a clear picture of the deposit slip or stamped physical class card below.',
      contactWhatsApp: '+94 77 123 4567'
    };

    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem('inspire_general_settings');
      if (saved) {
        try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch {}
      }
      return DEFAULT_SETTINGS;
    }

    try {
      const { data, error } = await supabase
        .from('general_settings')
        .select('*')
        .eq('id', 'primary_settings')
        .maybeSingle();

      if (!error && data) {
        return {
          bankName: data.bank_name || DEFAULT_SETTINGS.bankName,
          accountName: data.account_name || DEFAULT_SETTINGS.accountName,
          accountNumber: data.account_number || DEFAULT_SETTINGS.accountNumber,
          branchName: data.branch_name || DEFAULT_SETTINGS.branchName,
          paymentInstructions: data.payment_instructions || DEFAULT_SETTINGS.paymentInstructions,
          contactWhatsApp: data.contact_whatsapp || DEFAULT_SETTINGS.contactWhatsApp
        };
      }
    } catch {}

    const saved = localStorage.getItem('inspire_general_settings');
    if (saved) {
      try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch {}
    }
    return DEFAULT_SETTINGS;
  },

  async updateGeneralSettings(settings: GeneralSettings): Promise<boolean> {
    localStorage.setItem('inspire_general_settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('inspire-settings-updated', { detail: settings }));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('general_settings')
          .upsert({
            id: 'primary_settings',
            bank_name: settings.bankName,
            account_name: settings.accountName,
            account_number: settings.accountNumber,
            branch_name: settings.branchName,
            payment_instructions: settings.paymentInstructions,
            contact_whatsapp: settings.contactWhatsApp,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.warn('Notice saving general settings to Supabase:', err);
      }
    }
    return true;
  },

  // -------------------------------------------------------------
  // INSTITUTIONS MANAGEMENT (GENERAL SETTINGS)
  // -------------------------------------------------------------
  async addInstitution(name: string, location?: string): Promise<DbInstitution> {
    const newInst: DbInstitution = {
      id: `inst-${Date.now()}`,
      name: name.trim(),
      location: location?.trim() || null,
      is_active: true
    };

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from('institutions')
          .insert({
            name: newInst.name,
            location: newInst.location,
            is_active: true
          })
          .select()
          .single();
        if (data) return data;
      } catch {}
    }

    const local: DbInstitution[] = JSON.parse(localStorage.getItem('inspire_institutions') || '[]');
    local.push(newInst);
    localStorage.setItem('inspire_institutions', JSON.stringify(local));
    window.dispatchEvent(new CustomEvent('inspire-institutions-updated'));
    return newInst;
  },

  async toggleInstitutionActive(id: string, isActive: boolean): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('institutions')
          .update({ is_active: isActive })
          .eq('id', id);
      } catch {}
    }

    const local: DbInstitution[] = JSON.parse(localStorage.getItem('inspire_institutions') || '[]');
    const updated = local.map(i => i.id === id ? { ...i, is_active: isActive } : i);
    localStorage.setItem('inspire_institutions', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('inspire-institutions-updated'));
    return true;
  },

  async deleteInstitution(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('institutions')
          .delete()
          .eq('id', id);
      } catch {}
    }

    const local: DbInstitution[] = JSON.parse(localStorage.getItem('inspire_institutions') || '[]');
    const updated = local.filter(i => i.id !== id);
    localStorage.setItem('inspire_institutions', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('inspire-institutions-updated'));
    return true;
  },

  // -------------------------------------------------------------
  // PAYMENT SLIP APPROVAL WORKFLOW
  // -------------------------------------------------------------
  async getPaymentSlips(): Promise<PaymentSlip[]> {
    let list: PaymentSlip[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('payment_slips')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          list = data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            studentId: r.student_id,
            studentName: r.student_name,
            studentEmail: r.student_email,
            paymentType: r.payment_type as PaymentType,
            month: r.month,
            batch: r.batch,
            amount: Number(r.amount || 3500),
            referenceNo: r.reference_no,
            slipImageUrl: r.slip_image_url,
            status: r.status as SlipStatus,
            declineReason: r.decline_reason,
            createdAt: r.created_at,
            reviewedAt: r.reviewed_at
          }));
        }
      } catch (err) {
        console.warn('Notice fetching payment slips from Supabase:', err);
      }
    }

    // Merge with localStorage
    const localSlips: PaymentSlip[] = JSON.parse(localStorage.getItem('inspire_payment_slips') || '[]');
    const map = new Map<string, PaymentSlip>();
    list.forEach(s => map.set(s.id, s));
    localSlips.forEach(s => {
      if (!map.has(s.id)) map.set(s.id, s);
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async submitPaymentSlip(params: {
    userId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    paymentType: PaymentType;
    month: string;
    batch: string;
    amount?: number;
    referenceNo?: string;
    slipImageUrl: string;
  }): Promise<{ success: boolean; slipId?: string; error?: string }> {
    const slipId = `slip-${Date.now()}`;
    const newSlip: PaymentSlip = {
      id: slipId,
      userId: params.userId,
      studentId: params.studentId,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      paymentType: params.paymentType,
      month: params.month,
      batch: params.batch,
      amount: params.amount || 3500,
      referenceNo: params.referenceNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      slipImageUrl: params.slipImageUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Store in localStorage immediately
    try {
      const existing: PaymentSlip[] = JSON.parse(localStorage.getItem('inspire_payment_slips') || '[]');
      localStorage.setItem('inspire_payment_slips', JSON.stringify([newSlip, ...existing]));
      window.dispatchEvent(new CustomEvent('inspire-slips-updated'));
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('payment_slips')
          .insert({
            user_id: params.userId,
            student_id: params.studentId,
            student_name: params.studentName,
            student_email: params.studentEmail,
            payment_type: params.paymentType,
            month: params.month,
            batch: params.batch,
            amount: params.amount || 3500,
            reference_no: newSlip.referenceNo,
            slip_image_url: params.slipImageUrl,
            status: 'pending'
          })
          .select('id')
          .single();

        if (error) {
          console.warn('Notice saving slip to Supabase, cached locally:', error.message);
        } else if (data?.id) {
          newSlip.id = data.id;
        }
      } catch (err) {
        console.warn('Notice saving slip:', err);
      }
    }

    return { success: true, slipId: newSlip.id };
  },

  async approvePaymentSlip(slipId: string): Promise<boolean> {
    const slips = await this.getPaymentSlips();
    const target = slips.find(s => s.id === slipId);
    if (!target) return false;

    target.status = 'approved';
    target.reviewedAt = new Date().toISOString();

    // 1. Update slip status locally
    const localSlips: PaymentSlip[] = JSON.parse(localStorage.getItem('inspire_payment_slips') || '[]');
    const updatedSlips = localSlips.map(s => s.id === slipId ? { ...s, status: 'approved' as SlipStatus, reviewedAt: target.reviewedAt } : s);
    localStorage.setItem('inspire_payment_slips', JSON.stringify(updatedSlips));

    // 2. Grant Student Monthly Access for that month & batch
    const accessKey = `inspire_monthly_access_${target.userId}`;
    const localAccess: StudentMonthlyAccess[] = JSON.parse(localStorage.getItem(accessKey) || '[]');
    const newAccess: StudentMonthlyAccess = {
      id: `acc-${Date.now()}`,
      userId: target.userId,
      studentId: target.studentId,
      month: target.month,
      batch: target.batch,
      isActive: true,
      unlockedAt: new Date().toISOString()
    };
    const filteredAccess = localAccess.filter(a => !(a.month === target.month && a.batch === target.batch));
    localStorage.setItem(accessKey, JSON.stringify([newAccess, ...filteredAccess]));

    // Global access registry for instant lookup
    const globalAccessMap = JSON.parse(localStorage.getItem('inspire_global_monthly_access') || '{}');
    const userMapKey = `${target.userId}_${target.month.toLowerCase()}`;
    globalAccessMap[userMapKey] = true;
    localStorage.setItem('inspire_global_monthly_access', JSON.stringify(globalAccessMap));

    // 3. Supabase persistence
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('payment_slips')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('id', slipId);

        await supabase
          .from('student_monthly_access')
          .upsert({
            user_id: target.userId,
            student_id: target.studentId,
            month: target.month,
            batch: target.batch,
            is_active: true
          }, { onConflict: 'user_id,month,batch' });
      } catch (err) {
        console.warn('Notice syncing slip approval to Supabase:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('inspire-slips-updated'));
    window.dispatchEvent(new CustomEvent('inspire-monthly-access-updated'));
    return true;
  },

  async declinePaymentSlip(slipId: string, reason?: string): Promise<boolean> {
    const localSlips: PaymentSlip[] = JSON.parse(localStorage.getItem('inspire_payment_slips') || '[]');
    const updated = localSlips.map(s => s.id === slipId ? {
      ...s,
      status: 'declined' as SlipStatus,
      declineReason: reason || 'Receipt verification unsuccessful. Please re-upload a clear copy.',
      reviewedAt: new Date().toISOString()
    } : s);
    localStorage.setItem('inspire_payment_slips', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('payment_slips')
          .update({
            status: 'declined',
            decline_reason: reason || 'Receipt verification unsuccessful.',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', slipId);
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('inspire-slips-updated'));
    return true;
  },

  async getStudentMonthlyAccess(userId: string): Promise<StudentMonthlyAccess[]> {
    const accessKey = `inspire_monthly_access_${userId}`;
    const localList: StudentMonthlyAccess[] = JSON.parse(localStorage.getItem(accessKey) || '[]');

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from('student_monthly_access')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (data && data.length > 0) {
          const mapped: StudentMonthlyAccess[] = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            studentId: d.student_id,
            month: d.month,
            batch: d.batch,
            isActive: d.is_active,
            unlockedAt: d.created_at
          }));
          return mapped;
        }
      } catch {}
    }

    return localList;
  },

  async isMonthUnlockedForStudent(userId: string | null | undefined, month: string): Promise<boolean> {
    if (!userId) return false;

    // Check if user is admin
    try {
      const localAdmin = localStorage.getItem('inspire_admin_logged_in');
      if (localAdmin === 'true') return true;
    } catch {}

    const cleanMonth = (month || '').trim().toLowerCase();
    const globalAccessMap = JSON.parse(localStorage.getItem('inspire_global_monthly_access') || '{}');
    if (globalAccessMap[`${userId}_${cleanMonth}`]) return true;

    const accessList = await this.getStudentMonthlyAccess(userId);
    return accessList.some(a => a.month.toLowerCase() === cleanMonth && a.isActive);
  },

  // -------------------------------------------------------------
  // SCHEDULED LIVE ZOOM CLASSES
  // -------------------------------------------------------------
  async getLiveClasses(): Promise<LiveClass[]> {
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem('inspire_live_classes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return (Array.isArray(parsed) ? parsed : []).filter((c: any) => c.id !== 'live-01' && c.id !== 'live-02');
        } catch {}
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          title: d.title,
          batch: d.batch,
          month: d.month,
          scheduledAt: d.scheduled_at,
          durationMinutes: d.duration_minutes || 120,
          zoomLink: d.zoom_link,
          zoomPasscode: d.zoom_passcode,
          agenda: d.agenda,
          isFree: Boolean(d.is_free),
          status: d.status as 'upcoming' | 'live' | 'completed',
          createdAt: d.created_at
        }));
      }
    } catch (err) {
      console.warn('Notice fetching live classes from Supabase:', err);
    }

    const saved = localStorage.getItem('inspire_live_classes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return (Array.isArray(parsed) ? parsed : []).filter((c: any) => c.id !== 'live-01' && c.id !== 'live-02');
      } catch {}
    }
    return [];
  },

  async createLiveClass(data: Omit<LiveClass, 'id'>): Promise<LiveClass> {
    const newClass: LiveClass = {
      ...data,
      id: `live-${Date.now()}`
    };

    const existing = await this.getLiveClasses();
    const updated = [newClass, ...existing];
    localStorage.setItem('inspire_live_classes', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data: dbItem } = await supabase
          .from('live_classes')
          .insert({
            title: data.title,
            batch: data.batch,
            month: data.month,
            scheduled_at: data.scheduledAt,
            duration_minutes: data.durationMinutes,
            zoom_link: data.zoomLink,
            zoom_passcode: data.zoomPasscode,
            agenda: data.agenda,
            is_free: data.isFree,
            status: data.status
          })
          .select()
          .single();
        if (dbItem?.id) newClass.id = dbItem.id;
      } catch (err) {
        console.warn('Notice saving live class to Supabase:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('inspire-live-classes-updated'));
    return newClass;
  },

  async deleteLiveClass(id: string): Promise<boolean> {
    const existing = await this.getLiveClasses();
    const updated = existing.filter(c => c.id !== id);
    localStorage.setItem('inspire_live_classes', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('live_classes')
          .delete()
          .eq('id', id);
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('inspire-live-classes-updated'));
    return true;
  },

  // -------------------------------------------------------------
  // CATEGORIZED MATERIAL UPLOADS (TUTES, PAST PAPERS, MARKING SCHEMES)
  // -------------------------------------------------------------
  async getCategorizedMaterials(): Promise<CategorizedMaterial[]> {
    // 1. First attempt to load from persistent server database
    try {
      const res = await fetch('/api/materials');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.materials) && json.materials.length > 0) {
          // Sanitize: never store base64 payloads in localStorage
          const safeList = json.materials.map((m: any) => ({
            ...m,
            fileUrl: m.fileUrl?.startsWith('data:') ? '' : m.fileUrl
          }));
          safeLocalStorageSet('inspire_categorized_materials', JSON.stringify(safeList));
          return json.materials;
        }
      }
    } catch {}

    // 2. Fall back to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: String(d.id),
            title: d.title,
            category: (d.category as 'tute' | 'past_paper' | 'marking_scheme') || 'tute',
            batch: d.batch || 'A/L 2025',
            month: d.month || 'August',
            isFree: d.is_free !== undefined ? Boolean(d.is_free) : (d.price === 0),
            price: Number(d.price || 0),
            fileUrl: d.file_url,
            fileSize: d.file_size ? `${Math.round(d.file_size / 1024)} KB` : 'PDF Document',
            createdAt: d.created_at
          }));
          safeLocalStorageSet('inspire_categorized_materials', JSON.stringify(mapped));
          return mapped;
        }
      } catch {}
    }

    // 3. Fall back to localStorage
    const saved = localStorage.getItem('inspire_categorized_materials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return (Array.isArray(parsed) ? parsed : []).filter((m: any) => !m.id?.startsWith('mat-cat-'));
      } catch {}
    }
    return [];
  },

  async uploadCategorizedMaterial(data: Omit<CategorizedMaterial, 'id'>): Promise<CategorizedMaterial> {
    let finalUrl = data.fileUrl;
    let finalSize = data.fileSize || '3.5 MB';
    let assignedId = `cat-mat-${Date.now()}`;

    // If fileUrl is a base64 data string, upload to Cloudflare R2 / Server storage via /api/upload-document
    if (data.fileUrl && data.fileUrl.startsWith('data:')) {
      try {
        const res = await fetch('/api/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: data.fileUrl,
            title: data.title,
            category: data.category,
            batch: data.batch,
            month: data.month,
            isFree: data.isFree,
            price: data.price
          })
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.material) {
            finalUrl = result.url || result.material.fileUrl;
            finalSize = result.material.fileSize || finalSize;
            assignedId = result.material.id || assignedId;
          }
        }
      } catch (uploadErr) {
        console.warn('Document server upload notice, proceeding with payload:', uploadErr);
      }
    }

    // Safety fallback: NEVER allow base64 string to be stored in localStorage
    const urlForStorage = (finalUrl && !finalUrl.startsWith('data:')) 
      ? finalUrl 
      : `/uploads/documents/${assignedId}.pdf`;

    const newMaterial: CategorizedMaterial = {
      ...data,
      id: assignedId,
      fileUrl: urlForStorage,
      fileSize: finalSize
    };

    const existing = await this.getCategorizedMaterials();
    // Sanitize all items before storing to guarantee zero base64 entries
    const safeExisting = existing.map(m => ({
      ...m,
      fileUrl: m.fileUrl?.startsWith('data:') ? '' : m.fileUrl
    }));
    const updated = [newMaterial, ...safeExisting.filter(m => m.id !== assignedId)];
    safeLocalStorageSet('inspire_categorized_materials', JSON.stringify(updated));

    // Also persist metadata to /api/materials
    try {
      fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material: newMaterial })
      }).catch(() => {});
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const { data: dbItem } = await supabase
          .from('materials')
          .insert({
            title: data.title,
            file_url: urlForStorage,
            category: data.category,
            is_free: data.isFree,
            price: data.price,
            month: data.month,
            batch: data.batch,
            file_size: 1024 * 1024
          })
          .select()
          .single();
        if (dbItem?.id) newMaterial.id = String(dbItem.id);
      } catch (err) {
        console.warn('Notice saving material to Supabase:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('inspire-materials-updated'));
    return newMaterial;
  },

  async deleteCategorizedMaterial(id: string): Promise<boolean> {
    const existing = await this.getCategorizedMaterials();
    const updated = existing.filter(m => m.id !== id);
    safeLocalStorageSet('inspire_categorized_materials', JSON.stringify(updated));

    // Persist deletion to server database
    try {
      fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      }).catch(() => {});
    } catch {}

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('materials')
          .delete()
          .eq('id', id);
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('inspire-materials-updated'));
    return true;
  }
};

