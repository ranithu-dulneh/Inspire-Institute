import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or invalid. Check secrets configuration.'
  );
}

export function clearSupabaseAuthStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.includes('supabase.auth.token'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => window.localStorage.removeItem(k));
    } catch {}
  }
}

// Proactive startup check: purge any invalid, expired, or future-dated JWT tokens from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith('sb-') || k.includes('supabase.auth.token'))) {
        const item = window.localStorage.getItem(k);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            const token = parsed?.access_token || parsed?.currentSession?.access_token;
            if (token && typeof token === 'string') {
              const parts = token.split('.');
              if (parts.length === 3) {
                // Base64Url decode payload
                const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                const nowSec = Math.floor(Date.now() / 1000);
                // If iat is ahead of local time or expired
                if ((payload.iat && payload.iat > nowSec + 2) || (payload.exp && payload.exp < nowSec)) {
                  keysToRemove.push(k);
                }
              }
            }
          } catch {
            keysToRemove.push(k);
          }
        }
      }
    }
    keysToRemove.forEach(k => window.localStorage.removeItem(k));
  } catch {}
}

const customFetch: typeof fetch = async (input, init) => {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (netErr) {
    throw netErr;
  }

  // Intercept 401 with PGRST303 or clock skew errors
  if (response.status === 401) {
    try {
      const clone = response.clone();
      const body = await clone.json();
      if (
        body?.code === 'PGRST303' ||
        (typeof body?.message === 'string' && (
          body.message.toLowerCase().includes('jwt issued at future') ||
          body.message.toLowerCase().includes('jwt expired') ||
          body.message.toLowerCase().includes('invalid jwt')
        ))
      ) {
        clearSupabaseAuthStorage();

        // Retry seamlessly using the pure anon key
        const newHeaders = new Headers(
          init?.headers || (input instanceof Request ? input.headers : {})
        );
        if (supabaseAnonKey) {
          newHeaders.set('apikey', supabaseAnonKey);
          newHeaders.set('Authorization', `Bearer ${supabaseAnonKey}`);
        } else {
          newHeaders.delete('Authorization');
        }

        const retryInit: RequestInit = {
          ...init,
          headers: newHeaders,
        };
        const retryInput = input instanceof Request ? new Request(input, { headers: newHeaders }) : input;
        return await fetch(retryInput, retryInit);
      }
    } catch {
      // not JSON or stream read error, return standard response
    }
  }

  return response;
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    global: {
      fetch: customFetch
    }
  }
);

// Type definitions corresponding to user database schema
export interface DbCourse {
  id: number;
  title: string;
  lessons: number;
  status: string;
  exam_year: string;
  created_at: string;
  visibility: 'assignable' | 'public';
  price: number;
}

export interface DbLesson {
  id: number;
  course_id: number;
  title: string;
  created_at: string;
  price: number;
}

export interface DbSession {
  id: number;
  lesson_id: number;
  title: string;
  youtube_link?: string | null;
  is_free: boolean;
  price: number;
  created_at: string;
}

export interface DbMaterial {
  id: number;
  title: string;
  file_url: string;
  file_size: number;
  course_id?: number | null;
  lesson_id?: number | null;
  session_id?: number | null;
  created_at: string;
}

export interface DbTute {
  id: string;
  title: string;
  file_path: string;
  thumbnail_path?: string | null;
  access_level: string;
  price: number;
  created_at: string;
}

export interface DbRecording {
  id: string;
  title: string;
  file_path: string;
  access_level: string;
  price: number;
  created_at: string;
}

export interface DbStudentProfile {
  id: string;
  student_id: string | null;
  full_name: string;
  is_approved: boolean;
  created_at: string;
  max_devices: number;
  institution_id?: string | null;
  batch_id?: string | null;
  medium_id?: string | null;
  course_program?: string | null;
  mobile_number?: string | null;
  district?: string | null;
}

export interface DbEnrollment {
  id: number;
  user_id: string;
  course_id: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface DbInstitution {
  id: string;
  name: string;
  location?: string | null;
  is_active: boolean;
}

export interface DbIntakeBatch {
  id: string;
  name: string;
  is_active: boolean;
}

export interface DbMedium {
  id: string;
  name: string;
  is_active: boolean;
}

export interface DbStuReceipt {
  id: string;
  file_path: string;
  reference_no?: string | null;
  user_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DbReceiptRequest {
  id: string;
  user_id: string;
  item_type: 'course' | 'lesson' | 'session';
  item_id: number;
  receipt_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DbDeviceSession {
  id: string;
  user_id: string;
  device_token: string;
  last_active_at: string;
  created_at: string;
}

/**
 * Resolves Cloudflare R2 storage URLs.
 * If file is already a full URL (https://...), returns as is.
 * Otherwise prefixes with VITE_R2_PUBLIC_URL if configured.
 */
export function resolveR2Url(filePath?: string | null): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:') || filePath.startsWith('blob:')) {
    return filePath;
  }
  const r2Base = (import.meta.env.VITE_R2_PUBLIC_URL || import.meta.env.VITE_R2_URL || '').trim();
  if (r2Base) {
    const cleanBase = r2Base.endsWith('/') ? r2Base.slice(0, -1) : r2Base;
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `${cleanBase}/${cleanPath}`;
  }
  return filePath;
}
