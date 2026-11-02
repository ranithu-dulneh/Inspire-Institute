import React, { useState } from 'react';
import { CurrentUser, ActiveTab } from '../types';
import { InspireLogo } from './InspireLogo';
import { Institution } from './InstitutionSelectModal';
import { supabaseService } from '../services/supabaseService';
import { 
  Eye, 
  EyeOff, 
  Video, 
  Users, 
  FileText, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  Clock,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';

interface StudentLoginPortalProps {
  onLoginSuccess: (user: CurrentUser) => void;
  onNavigate: (tab: ActiveTab) => void;
  selectedInstitute?: Institution | null;
  onOpenSignUp?: () => void;
}

export const StudentLoginPortal: React.FC<StudentLoginPortalProps> = ({
  onLoginSuccess,
  onNavigate,
  selectedInstitute,
  onOpenSignUp
}) => {
  const [loginMethod, setLoginMethod] = useState<'id' | 'email' | 'mobile'>('id');
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Modals for approval pending and device limit exceeded
  const [pendingModalData, setPendingModalData] = useState<{
    studentId: string;
    studentName?: string;
  } | null>(null);

  const [deviceLimitModalData, setDeviceLimitModalData] = useState<{
    studentId: string;
    studentName?: string;
    currentDevices: number;
    maxDevices: number;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Student ID or Email Address');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    // 1. Attempt real Supabase Authentication
    if (supabaseService.isConfigured) {
      try {
        const res = await supabaseService.loginWithSupabase(identifier, password);
        if (res.success && res.user) {
          setIsLoading(false);
          onLoginSuccess(res.user);
          if (res.user.role === 'Admin') {
            onNavigate('admin');
          } else {
            onNavigate('lms');
          }
          return;
        } else if (res.pendingApproval) {
          setIsLoading(false);
          setPendingModalData({
            studentId: res.studentId || identifier,
            studentName: res.studentName
          });
          return;
        } else if (res.deviceLimitExceeded) {
          setIsLoading(false);
          setDeviceLimitModalData({
            studentId: res.studentId || identifier,
            studentName: res.studentName,
            currentDevices: res.currentDevices || 1,
            maxDevices: res.maxDevices || 1
          });
          return;
        } else if (res.error) {
          const isAdminFallback = identifier.trim().toLowerCase() === 'admin' && password === '123456';
          if (!isAdminFallback) {
            setIsLoading(false);
            setErrorMsg(res.error);
            return;
          }
        }
      } catch (err: any) {
        console.warn('Supabase login error:', err);
      }
    }

    // 2. Admin fallback check (Username: admin, Password: 123456)
    const isAdmin = identifier.trim().toLowerCase() === 'admin' && password === '123456';

    setTimeout(() => {
      setIsLoading(false);
      if (isAdmin) {
        onLoginSuccess({
          id: 'admin-001',
          name: 'Administrator',
          role: 'Admin',
          indexNumber: 'ADMIN-FACULTY',
          batch: 'Executive Faculty Board',
          overallProgress: 100,
          email: 'admin@inspire-education.lk',
          phone: '+94 77 123 4567'
        });
        onNavigate('admin');
        return;
      }

      // Check local cache for student registration
      const localStudents: any[] = JSON.parse(localStorage.getItem('inspire_admin_students') || '[]');
      const cleanIdent = identifier.trim().toLowerCase();
      const matched = localStudents.find(s => 
        s.indexNumber?.toLowerCase() === cleanIdent || 
        s.email?.toLowerCase() === cleanIdent
      );

      if (matched) {
        // Approval check
        if (!matched.isApproved || matched.status === 'Pending Approval') {
          setPendingModalData({
            studentId: matched.indexNumber || identifier,
            studentName: matched.fullName
          });
          return;
        }

        // Device limit check
        const maxDev = matched.maxDevices || 1;
        const devToken = supabaseService.getDeviceToken();
        const storedKey = `inspire_device_sessions_${matched.id}`;
        const sessions: string[] = JSON.parse(localStorage.getItem(storedKey) || '[]');
        if (!sessions.includes(devToken) && sessions.length >= maxDev) {
          setDeviceLimitModalData({
            studentId: matched.indexNumber,
            studentName: matched.fullName,
            currentDevices: sessions.length,
            maxDevices: maxDev
          });
          return;
        }

        if (!sessions.includes(devToken)) {
          sessions.push(devToken);
          localStorage.setItem(storedKey, JSON.stringify(sessions));
        }

        onLoginSuccess({
          id: matched.id,
          name: matched.fullName,
          role: 'Student',
          indexNumber: matched.indexNumber,
          batch: matched.batch || 'A/L 2026',
          overallProgress: 50,
          email: matched.email,
          phone: matched.mobile || '+94 77 000 0000'
        });
        onNavigate('lms');
      } else {
        setErrorMsg('Invalid login credentials. Please check your Student ID / Email and password.');
      }
    }, 400);
  };

  const handleCopyStudentId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-2 sm:p-4 my-2 sm:my-6 relative">
      
      {/* ─────────────────────────────────────────────────────────────
          MODAL: ACCOUNT PENDING APPROVAL
         ───────────────────────────────────────────────────────────── */}
      {pendingModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Verification Pending
                </span>
              </div>
              <button
                onClick={() => setPendingModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-xl font-black text-slate-950 tracking-tight">
                Account Pending Approval
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                {pendingModalData.studentName ? `Hi ${pendingModalData.studentName}, your` : 'Your'} registration request has been recorded and is currently awaiting administrator review.
              </p>
            </div>

            {/* Student ID Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>ASSIGNED STUDENT ID</span>
                <span className="text-emerald-700">Official Index</span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-mono font-black text-xl text-slate-900 tracking-wider tabular-nums">
                  {pendingModalData.studentId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyStudentId(pendingModalData.studentId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">When can I log in?</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                As soon as our faculty administrator verifies your registration in the Admin Panel, your account will be activated and you will be able to sign in with your Student ID or Email.
              </p>
            </div>

            <button
              onClick={() => setPendingModalData(null)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Back to Login Screen
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DEVICE LIMIT REACHED
         ───────────────────────────────────────────────────────────── */}
      {deviceLimitModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Device Limit Reached
                </span>
              </div>
              <button
                onClick={() => setDeviceLimitModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-xl font-black text-slate-950 tracking-tight">
                Maximum Devices Exceeded
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Your account is currently authorized for <strong className="text-slate-900">{deviceLimitModalData.maxDevices} active device(s)</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-900">
                <span>Active Device Sessions</span>
                <span className="font-mono text-rose-700 font-bold tabular-nums">
                  {deviceLimitModalData.currentDevices} / {deviceLimitModalData.maxDevices} Devices
                </span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                To access your course materials from this device, please log out of your other active session, or contact the class administrator to increase your allowed devices.
              </p>
            </div>

            <button
              onClick={() => setDeviceLimitModalData(null)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Outer Split Card */}
      <div className="w-full max-w-6xl rounded-[32px] sm:rounded-[40px] overflow-hidden bg-white shadow-2xl border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT COLUMN: Educational Branding & Value Propositions */}
        <div className="lg:col-span-5 xl:col-span-6 relative bg-slate-950 text-white p-8 sm:p-12 flex flex-col justify-between overflow-hidden">
          
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/60 z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#15803d_0%,#064e3b_35%,#022c22_70%,#020617_100%)] opacity-80" />
            <div className="absolute top-1/4 -right-16 w-80 h-80 rounded-full bg-purple-700/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-96 h-96 rounded-full bg-emerald-600/25 blur-3xl pointer-events-none" />
          </div>

          {/* Top Brand bar */}
          <div className="relative z-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <InspireLogo size="md" variant="dark" />
              <div className="border-l border-white/20 pl-3">
                <span className="text-xs font-bold text-white block">Inspire Education</span>
                <span className="text-[10px] text-emerald-400 font-medium block">
                  by Mrs. Ruwanthi Senanayaka
                </span>
              </div>
            </div>

            {selectedInstitute && (
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-sans font-medium text-emerald-300 border border-emerald-500/30">
                {selectedInstitute.name}
              </span>
            )}
          </div>

          {/* Center: Title & Value Propositions */}
          <div className="relative z-20 space-y-6 my-auto py-8 text-left">
            <div className="inline-block transform -rotate-1">
              <span className="text-amber-400 text-lg sm:text-xl font-bold tracking-wide italic font-serif">
                The Sleepless Accounting Masterclass
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Master Accounting. <br />
                <span className="text-emerald-400">Ace your A/Ls.</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                Sri Lanka's leading A/L Accounting portal with certified syllabus modules, video streams, and past paper reviews.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 text-emerald-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Curriculum Video Lessons</h4>
                  <p className="text-[11px] sm:text-xs text-slate-300">
                    High definition lessons by Lead Faculty Mrs. Ruwanthi Senanayaka
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Monthly Classroom Batches</h4>
                  <p className="text-[11px] sm:text-xs text-slate-300">
                    Live structured batches for A/L 2026 and 2027 intakes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Syllabus Tutes &amp; Past Papers</h4>
                  <p className="text-[11px] sm:text-xs text-slate-300">
                    Official marking schemes and comprehensive downloadable material
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-20 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>© 2026 Inspire Education. All rights reserved.</span>
            <span className="text-slate-400 font-sans">Official Student Portal</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In Form */}
        <div className="lg:col-span-7 xl:col-span-6 bg-white p-8 sm:p-14 flex flex-col justify-center text-left">
          <div className="max-w-md w-full mx-auto space-y-7">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase">
                  STUDENT LEARNING PORTAL
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Log in using your Student ID or Email Address
              </p>
            </div>

            {/* Segmented Toggle: [ Student ID | Email ] */}
            <div className="p-1 rounded-2xl bg-slate-100 flex items-center text-xs font-semibold border border-slate-200/80">
              <button
                type="button"
                onClick={() => setLoginMethod('id')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  loginMethod === 'id'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student ID
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Email
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {loginMethod === 'id' 
                    ? 'Student ID (Stu_ID)' 
                    : 'Registered Email Address'}
                </label>
                <input
                  type={loginMethod === 'email' ? 'email' : 'text'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    loginMethod === 'id' 
                      ? 'e.g. 2026-4819' 
                      : 'student@example.com'
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Learning Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Links */}
            <div className="text-center space-y-3 pt-2 text-xs">
              {infoMsg && (
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 text-xs text-center border border-blue-200">
                  {infoMsg}
                </div>
              )}

              <button 
                type="button"
                onClick={() => setInfoMsg('To reset your password or verify your student ID, please contact the student helpline or WhatsApp support (+94 77 123 4567).')}
                className="text-emerald-700 hover:text-emerald-800 font-bold block mx-auto transition-colors"
              >
                Forgot password?
              </button>

              <p className="text-slate-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={onOpenSignUp}
                  className="text-emerald-700 hover:text-emerald-800 font-bold underline transition-colors"
                >
                  Create account / Register
                </button>
              </p>
            </div>

            {/* Quick Access for Admin */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin');
                  setPassword('123456');
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fill Admin Credentials (admin / 123456)</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
