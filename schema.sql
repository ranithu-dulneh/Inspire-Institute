-- ==============================================================================
-- INSPIRE LMS - COMPLETE DATABASE SCHEMA (PostgreSQL / Supabase)
-- ==============================================================================
-- This script contains all table definitions, relationships, indexes, 
-- Row Level Security (RLS) policies, triggers, and initial seed data.
-- Run this in the SQL Editor of your target PostgreSQL / Supabase project.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. LOOKUP / REFERENCE TABLES
-- ==============================================================================

-- Institutions / Physical Registration Centers
CREATE TABLE IF NOT EXISTS public.institutions (
    id TEXT PRIMARY KEY DEFAULT ('inst-' || extract(epoch from now())::bigint),
    name TEXT NOT NULL,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Intake Batches (e.g., A/L 2025, A/L 2026, A/L 2027)
CREATE TABLE IF NOT EXISTS public.intake_batches (
    id TEXT PRIMARY KEY DEFAULT ('batch-' || extract(epoch from now())::bigint),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Language Mediums (Sinhala, English, Tamil)
CREATE TABLE IF NOT EXISTS public.mediums (
    id TEXT PRIMARY KEY DEFAULT ('med-' || extract(epoch from now())::bigint),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- General Settings (Teacher Bank Transfer Details, Support WhatsApp, System Config)
CREATE TABLE IF NOT EXISTS public.general_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_settings',
    bank_name TEXT NOT NULL DEFAULT 'Commercial Bank of Ceylon',
    account_name TEXT NOT NULL DEFAULT 'Inspire Academy of Accounting',
    account_number TEXT NOT NULL DEFAULT '8001234567',
    branch_name TEXT NOT NULL DEFAULT 'Nugegoda City Branch',
    payment_instructions TEXT NOT NULL DEFAULT 'Please include your Student ID as the deposit reference. Upload a clear picture of the deposit slip or stamped physical class card.',
    contact_whatsapp TEXT NOT NULL DEFAULT '+94 77 123 4567',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. USER MANAGEMENT & AUTHENTICATION
-- ==============================================================================

-- Admin Users Table (Grants executive access and bypasses device limits)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student Profiles (Linked to auth.users if using Supabase Auth or standalone UUIDs)
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY,
    student_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    mobile_number TEXT,
    district TEXT,
    institution_id TEXT REFERENCES public.institutions(id) ON DELETE SET NULL,
    batch_id TEXT,
    medium_id TEXT,
    course_program TEXT DEFAULT '2025 A/L Commerce',
    is_approved BOOLEAN NOT NULL DEFAULT false,
    max_devices INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Active Device Sessions (Device lock enforcement)
CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_device UNIQUE (user_id, device_token)
);

-- ==============================================================================
-- 4. CURRICULUM, COURSES, LESSONS & SESSIONS
-- ==============================================================================

-- Courses / Main Modules
CREATE TABLE IF NOT EXISTS public.courses (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    lessons INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',
    exam_year TEXT NOT NULL DEFAULT '2025',
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('assignable', 'public')),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lessons (Belong to a Course/Subject)
CREATE TABLE IF NOT EXISTS public.lessons (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    batch TEXT NOT NULL DEFAULT 'A/L 2025',
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 3000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Video Sessions (Weekly lessons under a lesson module)
CREATE TABLE IF NOT EXISTS public.sessions (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    month TEXT NOT NULL DEFAULT 'August',
    youtube_link TEXT,
    duration TEXT DEFAULT '1h 45m',
    is_free BOOLEAN NOT NULL DEFAULT false,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. MATERIALS & PAPERS (Tutes, Past Papers, Marking Schemes)
-- ==============================================================================

-- Universal Categorized Materials (Supports Direct Uploads to Supabase / Cloudflare R2)
CREATE TABLE IF NOT EXISTS public.materials (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT DEFAULT 1048576, -- In bytes
    category TEXT NOT NULL DEFAULT 'tute' CHECK (category IN ('tute', 'past_paper', 'marking_scheme')),
    batch TEXT NOT NULL DEFAULT 'A/L 2025',
    month TEXT NOT NULL DEFAULT 'August',
    is_free BOOLEAN NOT NULL DEFAULT true,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE SET NULL,
    lesson_id BIGINT REFERENCES public.lessons(id) ON DELETE SET NULL,
    session_id BIGINT REFERENCES public.sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Standalone Tutes Table
CREATE TABLE IF NOT EXISTS public."Tutes" (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    access_level TEXT NOT NULL DEFAULT 'paid',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Standalone Recordings Table
CREATE TABLE IF NOT EXISTS public."Recordings" (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    access_level TEXT NOT NULL DEFAULT 'paid',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. LIVE ZOOM CLASSES
-- ==============================================================================

-- Scheduled Live Masterclasses & Zoom Lectures
CREATE TABLE IF NOT EXISTS public.live_classes (
    id TEXT PRIMARY KEY DEFAULT ('live-' || extract(epoch from now())::bigint),
    title TEXT NOT NULL,
    batch TEXT NOT NULL DEFAULT 'A/L 2025',
    month TEXT NOT NULL DEFAULT 'September',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    zoom_link TEXT NOT NULL,
    zoom_passcode TEXT,
    agenda TEXT,
    is_free BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. PAYMENTS, SLIP VERIFICATION & MONTHLY ACCESS
-- ==============================================================================

-- Bank Transfer & Class Card Payment Verification Slips
CREATE TABLE IF NOT EXISTS public.payment_slips (
    id TEXT PRIMARY KEY DEFAULT ('slip-' || extract(epoch from now())::bigint),
    user_id UUID NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('bank_transfer', 'class_card')),
    month TEXT NOT NULL,
    batch TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 3500.00,
    reference_no TEXT,
    slip_image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    decline_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student Monthly Access Table (Granted upon Admin Approval of Payment Slip)
CREATE TABLE IF NOT EXISTS public.student_monthly_access (
    id TEXT PRIMARY KEY DEFAULT ('acc-' || extract(epoch from now())::bigint),
    user_id UUID NOT NULL,
    student_id TEXT NOT NULL,
    month TEXT NOT NULL,
    batch TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_month_batch UNIQUE (user_id, month, batch)
);

-- Course Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Receipt Verification Requests (Legacy / Secondary verification)
CREATE TABLE IF NOT EXISTS public."Stu_Reciepts" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL,
    reference_no TEXT,
    user_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.receipt_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('course', 'lesson', 'session')),
    item_id BIGINT NOT NULL,
    receipt_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. INDEXES FOR HIGH QUERY PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON public.student_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_email ON public.student_profiles(email);
CREATE INDEX IF NOT EXISTS idx_student_profiles_is_approved ON public.student_profiles(is_approved);

CREATE INDEX IF NOT EXISTS idx_payment_slips_user_id ON public.payment_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_slips_status ON public.payment_slips(status);
CREATE INDEX IF NOT EXISTS idx_payment_slips_month_batch ON public.payment_slips(month, batch);

CREATE INDEX IF NOT EXISTS idx_student_monthly_access_lookup ON public.student_monthly_access(user_id, month, is_active);

CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_batch_month ON public.materials(batch, month);

CREATE INDEX IF NOT EXISTS idx_live_classes_batch_month ON public.live_classes(batch, month, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_sessions_lesson_id ON public.sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mediums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tutes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Recordings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_monthly_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Stu_Reciepts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_requests ENABLE ROW LEVEL SECURITY;

-- Permissive public read & authenticated write policies for API and client operations
DO $$ 
BEGIN
    -- Public reference tables (Readable by all)
    EXECUTE 'CREATE POLICY "Allow public read on institutions" ON public.institutions FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow admin manage institutions" ON public.institutions FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Allow public read on intake_batches" ON public.intake_batches FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read on mediums" ON public.mediums FOR SELECT USING (true)';

    EXECUTE 'CREATE POLICY "Allow public read on general_settings" ON public.general_settings FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow admin update general_settings" ON public.general_settings FOR ALL USING (true) WITH CHECK (true)';

    -- Student Profiles
    EXECUTE 'CREATE POLICY "Allow public read on student_profiles" ON public.student_profiles FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow insert on student_profiles" ON public.student_profiles FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Allow update on student_profiles" ON public.student_profiles FOR UPDATE USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Allow delete on student_profiles" ON public.student_profiles FOR DELETE USING (true)';

    -- Admin Users
    EXECUTE 'CREATE POLICY "Allow public read on admin_users" ON public.admin_users FOR SELECT USING (true)';

    -- Device Sessions
    EXECUTE 'CREATE POLICY "Allow all on device_sessions" ON public.device_sessions FOR ALL USING (true) WITH CHECK (true)';

    -- Courses, Lessons, Sessions & Materials
    EXECUTE 'CREATE POLICY "Allow public read on courses" ON public.courses FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow all on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Allow public read on lessons" ON public.lessons FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow all on lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Allow public read on sessions" ON public.sessions FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow all on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Allow public read on materials" ON public.materials FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow all on materials" ON public.materials FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Allow public read on Tutes" ON public."Tutes" FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow all on Tutes" ON public."Tutes" FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Allow public read on Recordings" ON public."Recordings" FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow all on Recordings" ON public."Recordings" FOR ALL USING (true) WITH CHECK (true)';

    -- Live Classes
    EXECUTE 'CREATE POLICY "Allow public read on live_classes" ON public.live_classes FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow all on live_classes" ON public.live_classes FOR ALL USING (true) WITH CHECK (true)';

    -- Payment Slips & Access
    EXECUTE 'CREATE POLICY "Allow all on payment_slips" ON public.payment_slips FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Allow all on student_monthly_access" ON public.student_monthly_access FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Allow all on enrollments" ON public.enrollments FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Allow all on Stu_Reciepts" ON public."Stu_Reciepts" FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Allow all on receipt_requests" ON public.receipt_requests FOR ALL USING (true) WITH CHECK (true)';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 10. INITIAL SEED DATA
-- ==============================================================================

-- 1. General Settings (Bank Account Details)
INSERT INTO public.general_settings (id, bank_name, account_name, account_number, branch_name, payment_instructions, contact_whatsapp)
VALUES (
    'primary_settings',
    'Commercial Bank of Ceylon',
    'Inspire Academy of Accounting',
    '8001234567',
    'Nugegoda City Branch',
    'Please include your Student ID as the deposit reference. Upload a clear picture of the deposit slip or stamped physical class card.',
    '+94 77 123 4567'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Registration Institutes / Centers
INSERT INTO public.institutions (id, name, location, is_active) VALUES
('inst-rotary', 'Rotary Hall - Nugegoda', 'Nugegoda, Western Province', true),
('inst-siyatha', 'Siyatha - Kurunegala', 'Kurunegala, North Western Province', true),
('inst-online', 'Inspire Online Portal', 'Island-wide Direct Access', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Intake Batches
INSERT INTO public.intake_batches (id, name, is_active) VALUES
('batch-2025', 'A/L 2025', true),
('batch-2026', 'A/L 2026', true),
('batch-2027', 'A/L 2027', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Mediums
INSERT INTO public.mediums (id, name, is_active) VALUES
('med-sin', 'Sinhala', true),
('med-eng', 'English', true),
('med-tam', 'Tamil', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Default Course Structure
INSERT INTO public.courses (id, title, lessons, status, exam_year, visibility, price)
VALUES (1, 'G.C.E. Advanced Level Accounting', 12, 'Active', '2025', 'public', 3500.00)
ON CONFLICT (id) DO NOTHING;

-- 6. Assign Primary Administrator: inspireinstitute.lms@gmail.com
-- If the user exists in auth.users, promote them directly:
INSERT INTO public.admin_users (user_id, email, role)
SELECT id, email, 'Admin'
FROM auth.users
WHERE email = 'inspireinstitute.lms@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET role = 'Admin', email = EXCLUDED.email;

-- Pre-approve their profile if present
UPDATE public.student_profiles
SET is_approved = true, max_devices = 999
WHERE email = 'inspireinstitute.lms@gmail.com';

