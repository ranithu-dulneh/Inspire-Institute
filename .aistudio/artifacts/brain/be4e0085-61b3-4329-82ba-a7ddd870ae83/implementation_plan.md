# Monthly Paid Access, Slip Approvals, Live Zoom Classes & General Settings

Comprehensive architectural blueprint to introduce strict monthly fee paywalls across lesson modules, bank transfer & physical class card payment slip verification in the Admin Panel, scheduled live Zoom classes, categorized material uploads, and a consolidated General Settings tab with bank account details and active institutes.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned via interactive clarification and will govern the build:
>
> - **Payment Slip & Card Submission**: Students can select their verification method (**Bank Transfer** or **Physical Class Card**) and upload a clear photo of the deposit receipt or stamped class card.
> - **Unlocking Scope Upon Approval**: Approving a payment slip automatically unlocks **all lesson sessions, video masterclasses, curriculum tutes, and live classes** for that specific cohort month.
> - **Live Zoom Classes Location**: A dedicated **Live Classes** tab on the navigation bar and an interactive live schedule banner inside the Student LMS Dashboard.
> - **Material Uploads**: A dedicated **Material Uploads** admin tab supporting file storage (Cloudflare R2 / Supabase Storage) with categorization into **Tutes**, **Past Papers**, or **Marking Schemes**, and a **Free vs. Paid** toggle with customizable pricing.
> - **General Settings Consolidation**: Replaces the separate Faculty & Results tab with a unified **General Settings** panel managing Teacher Bank Details, Student Registration Institutes, Faculty Photo/Scale/Offset, and Ranker Results.

---

## 1. Overview & Core Concept

### What It Delivers
1. **Strict Content Paywalling**:
   - Guests and unauthenticated users browsing the public Lesson Modules view see transparent lock indicators with price previews.
   - When clicked, a modal prompts non-logged-in users to sign in or register, and prompts enrolled students to submit a payment slip for that month.
   - Only students with an approved payment slip (or free sessions) can launch video playback or access study materials.
2. **Payment Slip Approval Workflow**:
   - A dedicated **Payment Slip Approval** tab in the Admin Panel where administrators review pending submissions with student name, index number, batch, payment type (Bank Transfer or Physical Class Card), uploaded slip image with zoom preview, and direct **Approve** and **Decline** action buttons.
3. **Scheduled Live Zoom Masterclasses**:
   - Students with approved monthly access can view upcoming live sessions, countdowns, topic agendas, and a direct **Join Zoom Class** button.
   - Unpaid students see scheduled topics but the meeting link remains locked until their monthly fee is verified.
4. **Categorized Material Uploads**:
   - Admins can upload PDFs and files categorized into **Tutes**, **Past Papers**, or **Marking Schemes**, tag them to specific Batches/Months, and designate them as **Free** or **Paid (with amount in LKR)**.
5. **Consolidated General Settings**:
   - Replaces the previous Faculty tab. Enables configuring Teacher Bank Details (Bank Name, Branch, Account Number, Account Holder Name, Special Instructions), managing active Registration Institutes (e.g., Rotary Hall, Syzygy, Online Portal), and managing the Teacher portrait cutout and student results.

---

## 2. User Experience & Visual Design

### Design Language & Typography
- **Typography**: Apple SF Pro Display styling (`-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`) with balanced headline scales, crisp numerical tabular fonts (`tabular-nums font-mono` for pricing and dates), and high legibility.
- **Color Budget (60-30-10)**:
  - **60% Neutral Canvas**: Crisp, minimal light background (`#F8FAFC` to pure white) with soft ambient slate undertones.
  - **30% Structural Surfaces**: Clean bordered cards (`border-slate-200/80`), subtle white backdrops, and hairline dividers.
  - **10% Focused Accents**: Deep Inspire Navy (`#0B1528` / `#1E3A8A`) for primary actions, Emerald (`#059669`) for verified/unlocked states and approvals, and Coral Rose (`#E11D48`) for locked cues and declines.
- **Zero-Pill Discipline**:
  - Metadata (e.g. `August Cohort · 4 Sessions · Accounting Theory`) rendered as clean unboxed inline text with typographic dot separators (`·`).
  - Segmented interactive filters styled as flush tab switches rather than floating candy badges.

### Key User Flows

```
[Public Visitor / Unenrolled Student]
       │
       ▼
Browses "Lesson Modules" Tab  ──► Content marked with Lock Badge & Monthly Fee (e.g. Rs. 3,500)
       │
       ▼ Click "Unlock Module"
Modal Displays Teacher Bank Details + "Upload Bank Slip or Class Card"
       │
       ▼ Submits Slip Photo + Payment Type
[Submission Pending Status Notice] (Stored in Supabase `payment_slips`)
       │
       ▼
[Admin Panel: Payment Slip Approval Tab]
       │
       ├─► [Approve] ──► Automatically sets status to 'approved' & unlocks month
       └─► [Decline] ──► Sets status to 'declined' with optional feedback note
       │
       ▼
[Student Logs In / Refreshes]
All Sessions, Tutes & Live Zoom links for that month immediately UNLOCKED!
```

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Month-Level Access Token vs. Individual Session Unlocking
- **Approach**: Unlocking a monthly fee grants full access to that month's complete curriculum (all video sessions, tutes, and live classes).
- **Rationale**: Aligns with Sri Lankan A/L tuition standards where students pay a single monthly class fee granting access to 4–5 weekly sessions, live Zoom lectures, and paper discussions.

### Decision 2: Dual Verification for Bank Transfers & Physical Class Cards
- **Approach**: The slip upload modal features an intuitive selector between **Bank Deposit / Online Transfer** and **Physical Class Card**.
- **Rationale**: Students attending physical institutions (Rotary Hall, Sasip, Syzygy) receive monthly physical barcode cards stamped by the center. They can snap a picture of their physical card or enter their card receipt for online masterclass access.

### Decision 3: Cloudflare R2 & Supabase Dual-Resilience Storage
- **Approach**: Admin file uploads send binary assets to Supabase Storage or R2 (via `/api/upload` endpoint), storing metadata in `materials` and `Tutes`. If external storage is unreachable, files use direct data/blob URLs with zero UI breakages.

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
      ┌────────────────────────────┼───────────────────────────┐
      ▼                            ▼                           ▼
[Lesson Modules View]      [Live Classes View]       [Admin Dashboard]
  - Public Locked State      - Upcoming Live Dates     - Overview
  - Month Cohorts Filter     - Zoom Join Link (Paid)   - Students & Devices
  - Unlock Module CTA        - Syllabus Agenda         - Content & Curricula
      │                            │                   - Payment Slip Approval
      ▼                            ▼                   - Material Uploads
[Payment Slip Modal]         [Video Player]            - General Settings
  - Teacher Bank Info        (Custom embedded player)    * Bank Details
  - Bank / Card Selector                                 * Institutes
  - File Dropzone                                        * Photo & Results
      │
      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Supabase & Storage Data Layer                      │
│   payment_slips │ live_classes │ materials │ general_settings         │
└────────────────────────────────────────────────────────────────────────┘
```

### PostgreSQL Database Schema & Queries (For Supabase)

The following SQL queries create and update the necessary tables in Supabase:

```sql
-- 1. General Settings Table (Teacher Bank Details, System Config)
CREATE TABLE IF NOT EXISTS public.general_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary_settings',
  bank_name TEXT NOT NULL DEFAULT 'Commercial Bank of Ceylon',
  account_name TEXT NOT NULL DEFAULT 'Inspire Academy of Accounting',
  account_number TEXT NOT NULL DEFAULT '8001234567',
  branch_name TEXT NOT NULL DEFAULT 'Nugegoda City Branch',
  payment_instructions TEXT DEFAULT 'Please include your Student ID as the reference when making bank transfers.',
  contact_whatsapp TEXT DEFAULT '+94 77 123 4567',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default general settings record if none exists
INSERT INTO public.general_settings (id, bank_name, account_name, account_number, branch_name)
VALUES ('primary_settings', 'Commercial Bank of Ceylon', 'Inspire Academy of Accounting', '8001234567', 'Nugegoda City Branch')
ON CONFLICT (id) DO NOTHING;

-- 2. Payment Slips & Card Verifications Table
CREATE TABLE IF NOT EXISTS public.payment_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('bank_transfer', 'physical_card')),
  month TEXT NOT NULL,
  batch TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 3500,
  reference_no TEXT,
  slip_image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  decline_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_slips_user ON public.payment_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_slips_status ON public.payment_slips(status);

-- 3. Student Monthly Access Table (Unlocks content upon approval)
CREATE TABLE IF NOT EXISTS public.student_monthly_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  month TEXT NOT NULL,
  batch TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  slip_id UUID REFERENCES public.payment_slips(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, month, batch)
);

CREATE INDEX IF NOT EXISTS idx_student_monthly_access ON public.student_monthly_access(user_id, month);

-- 4. Live Zoom Classes Table
CREATE TABLE IF NOT EXISTS public.live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  batch TEXT NOT NULL,
  month TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  zoom_link TEXT NOT NULL,
  zoom_passcode TEXT,
  agenda TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Enhanced Materials Table Categorization (Tutes, Past Papers, Marking Schemes)
ALTER TABLE IF EXISTS public.materials 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'tute' CHECK (category IN ('tute', 'past_paper', 'marking_scheme')),
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS month TEXT,
  ADD COLUMN IF NOT EXISTS batch TEXT;

-- 6. Row Level Security Policies (Permissive read for students, admin writes)
ALTER TABLE public.payment_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_monthly_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read general settings" ON public.general_settings FOR SELECT USING (true);
CREATE POLICY "Allow anon insert slips" ON public.payment_slips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select own slips" ON public.payment_slips FOR SELECT USING (true);
CREATE POLICY "Allow anon select monthly access" ON public.student_monthly_access FOR SELECT USING (true);
CREATE POLICY "Allow anon select live classes" ON public.live_classes FOR SELECT USING (true);
```

---

## 5. Implementation Steps (Execution Phase)

1. **State & Supabase Service Extensions (`src/services/supabaseService.ts`)**:
   - Add data methods: `getGeneralSettings()`, `updateGeneralSettings()`, `getPaymentSlips()`, `submitPaymentSlip()`, `approvePaymentSlip()`, `declinePaymentSlip()`, `getStudentMonthlyAccess()`, `getLiveClasses()`, `createLiveClass()`, and `uploadCategorizedMaterial()`.
   - Implement local storage fallback cache so the app functions seamlessly in demo/offline mode.
2. **Locking & Payment Slip Modal (`src/components/ModulePaymentModal.tsx`)**:
   - Modernize the modal to fetch teacher bank details and provide the Bank Transfer vs. Physical Class Card selection.
   - Support file upload / camera capture of the payment receipt or class card.
   - Show instant submission feedback with pending review notice.
3. **Content Lock Enforcement (`src/components/VideoModulesView.tsx` & `LMSDashboard.tsx`)**:
   - Check if current student has an active approval for that session's month.
   - Unapproved or logged-out users see lock icons, price previews, and clicking prompts the payment slip modal.
4. **Scheduled Live Classes Feature (`src/components/LiveClassesView.tsx` & Dashboard integration)**:
   - Dedicated tab in navigation and quick-access banner on LMS Dashboard.
   - Displays countdown timer, scheduled date/time, agenda topics, and the verified Zoom Join button (unlocked for paid students).
5. **Admin Panel Redesign (`src/components/AdminDashboard.tsx`)**:
   - Rename/replace Faculty & Results tab with **General Settings** (Teacher Bank Info, Active Registration Institutes, Faculty Cutout, Ranker Results).
   - Add **Payment Slip Approval** tab with pending slip list, slip image modal zoom, student details, course/month info, and **Approve** / **Decline** buttons.
   - Add **Material Uploads** tab with categorization (Tutes, Past Papers, Marking Schemes), batch/month tags, and Free vs. Paid pricing configuration.
   - Add Live Zoom Class scheduling section under Content tab.
6. **Verification & Build Validation**:
   - Verify all handlers, tab switches, slip uploads, approval state changes, and live class zoom links.
   - Execute `compile_applet` and `lint_applet` to ensure zero compilation or syntax errors.
