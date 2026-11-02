import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  GraduationCap, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Institution } from './InstitutionSelectModal';
import { supabaseService } from '../services/supabaseService';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInstitute?: Institution | null;
  onChangeInstitute?: () => void;
  onGoToLogin?: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ 
  isOpen, 
  onClose,
  selectedInstitute,
  onChangeInstitute,
  onGoToLogin
}) => {
  const [selectedBatch, setSelectedBatch] = useState<'2026' | '2027'>('2026');
  const [medium, setMedium] = useState<'Sinhala' | 'English'>('Sinhala');
  const [studentName, setStudentName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [district, setDistrict] = useState<string>('Colombo');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // States for submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedStudentId, setGeneratedStudentId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please enter all required information.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await supabaseService.registerStudent({
        fullName: studentName.trim(),
        mobile: phone.trim(),
        email: email.trim(),
        password: password,
        confirmPassword: confirmPassword,
        batch: selectedBatch,
        district: district,
        institutionId: selectedInstitute?.id
      });

      setIsSubmitting(false);

      if (result.success && result.studentId) {
        setGeneratedStudentId(result.studentId);
      } else {
        setErrorMessage(result.error || 'Failed to submit registration. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Unexpected network error during registration.');
    }
  };

  const handleCopyId = () => {
    if (!generatedStudentId) return;
    navigator.clipboard.writeText(generatedStudentId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCloseAndReset = () => {
    setGeneratedStudentId(null);
    setStudentName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                G.C.E. A/L Accounting Admissions
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Student Sign Up &amp; Registration</h3>
            </div>
          </div>
          <button
            onClick={handleCloseAndReset}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Successful Registration View with Pending Confirmation & Student ID */}
        {generatedStudentId ? (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Administrator Approval</span>
              </div>
              <h4 className="text-xl font-black text-slate-950 tracking-tight">Registration Submitted!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Welcome, <strong className="text-slate-900">{studentName}</strong>! Your enrollment request has been submitted to Inspire Education administration.
              </p>
            </div>

            {/* Generated Student ID Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Official Student ID</span>
                <span className="text-[11px] font-medium text-emerald-700 font-sans">Save this index number</span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-mono font-black text-2xl tracking-wider text-slate-900 tabular-nums">
                  {generatedStudentId}
                </span>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  title="Copy Student ID"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed">
                Registered Email: <span className="font-semibold text-slate-800">{email}</span> · Batch: <span className="font-semibold text-slate-800">A/L {selectedBatch}</span>
              </div>
            </div>

            {/* Verification Process Notice */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-left text-xs text-blue-900 space-y-1">
              <p className="font-bold">Next Steps for Login:</p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Once the faculty administrator reviews and approves your registration request, you can log in using either your <strong className="text-blue-950">Student ID ({generatedStudentId})</strong> or your <strong className="text-blue-950">Email</strong> along with your password.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleCloseAndReset();
                  if (onGoToLogin) {
                    onGoToLogin();
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCloseAndReset}
                className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Registration Input Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto text-left">
            
            {/* Center Selection Header (Optional) */}
            {selectedInstitute && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedInstitute.name.charAt(0)}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900 truncate">{selectedInstitute.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{selectedInstitute.location}</p>
                  </div>
                </div>
                {onChangeInstitute && (
                  <button
                    type="button"
                    onClick={onChangeInstitute}
                    className="text-[11px] text-blue-700 hover:text-blue-800 font-bold underline shrink-0 ml-2"
                  >
                    Change
                  </button>
                )}
              </div>
            )}

            {/* Error Alert Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Batch & Medium Selector (Separate lines to prevent compacting on mobile) */}
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Academic Batch</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['2026', '2027'] as const).map(b => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setSelectedBatch(b)}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        selectedBatch === b
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      A/L {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Language Medium</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Sinhala', 'English'] as const).map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setMedium(m)}
                      className={`py-2.5 px-3 text-center rounded-xl border font-bold text-xs transition-all ${
                        medium === m
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m} Medium
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Personal Details */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Ruwanthi Jayasinghe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    WhatsApp Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="077 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-medium"
                  >
                    <option value="Colombo">Colombo</option>
                    <option value="Gampaha">Gampaha</option>
                    <option value="Kalutara">Kalutara</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Matale">Matale</option>
                    <option value="Nuwara Eliya">Nuwara Eliya</option>
                    <option value="Galle">Galle</option>
                    <option value="Matara">Matara</option>
                    <option value="Hambantota">Hambantota</option>
                    <option value="Kurunegala">Kurunegala</option>
                    <option value="Puttalam">Puttalam</option>
                    <option value="Anuradhapura">Anuradhapura</option>
                    <option value="Polonnaruwa">Polonnaruwa</option>
                    <option value="Badulla">Badulla</option>
                    <option value="Monaragala">Monaragala</option>
                    <option value="Ratnapura">Ratnapura</option>
                    <option value="Kegalle">Kegalle</option>
                    <option value="Other">Other District / Overseas</option>
                  </select>
                </div>
              </div>

              {/* Login Credentials: Email, Password, Confirm Password */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Portal Login Credentials
                </span>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Used for login and important course announcements.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type password"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Registration &amp; Request Access</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin approval required before activation</span>
                </span>
                {onGoToLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToLogin();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    Already registered? Sign In
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
