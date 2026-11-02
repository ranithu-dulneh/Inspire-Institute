import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  CreditCard, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { CurrentUser, GeneralSettings, PaymentType } from '../types';

export interface UnlockedModule {
  id: string;
  batch: string;
  title: string;
  month: string;
  priceLKR: number;
  description: string;
  isUnlocked: boolean;
  videoCount?: number;
  tuteCount?: number;
}

interface ModulePaymentModalProps {
  module: UnlockedModule | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessUnlock?: (moduleId: string) => void;
  currentUser?: CurrentUser | null;
  onRequireLogin?: () => void;
}

export const ModulePaymentModal: React.FC<ModulePaymentModalProps> = ({
  module,
  isOpen,
  onClose,
  onSuccessUnlock,
  currentUser,
  onRequireLogin
}) => {
  const [paymentType, setPaymentType] = useState<PaymentType>('bank_transfer');
  const [slipImage, setSlipImage] = useState<string>('');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    bankName: 'Commercial Bank of Ceylon',
    accountName: 'Inspire Academy of Accounting',
    accountNumber: '8001234567',
    branchName: 'Nugegoda City Branch',
    paymentInstructions: 'Please include your Student ID as the reference when making bank transfers.',
    contactWhatsApp: '+94 77 123 4567'
  });

  useEffect(() => {
    if (isOpen) {
      setIsSubmittedSuccess(false);
      setErrorMessage('');
      setSlipImage('');
      setReferenceNo('');
      supabaseService.getGeneralSettings().then(setGeneralSettings).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !module) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage('File size exceeds 8MB. Please select a smaller photo.');
        return;
      }
      setErrorMessage('');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSlipImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitVerification = async () => {
    if (!currentUser) {
      if (onRequireLogin) {
        onClose();
        onRequireLogin();
      } else {
        setErrorMessage('Please log in with your Student account first to submit your payment slip.');
      }
      return;
    }

    if (!slipImage) {
      setErrorMessage(
        paymentType === 'bank_transfer'
          ? 'Please attach a photo of your bank transfer receipt or deposit slip.'
          : 'Please attach a clear photo of your stamped physical class card.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await supabaseService.submitPaymentSlip({
        userId: currentUser.id,
        studentId: currentUser.indexNumber || currentUser.id.substring(0, 8),
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        paymentType,
        month: module.month || 'Current Cohort',
        batch: module.batch || 'A/L Cohort',
        amount: module.priceLKR || 3500,
        referenceNo: referenceNo.trim() || undefined,
        slipImageUrl: slipImage
      });

      if (res.success) {
        setIsSubmittedSuccess(true);
      } else {
        setErrorMessage(res.error || 'Failed to submit payment verification. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected network error submitting slip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 text-left space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmittedSuccess ? (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Verification Slip Submitted
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your <span className="font-semibold text-slate-900">{paymentType === 'bank_transfer' ? 'Bank Deposit Slip' : 'Physical Class Card'}</span> for{' '}
                <span className="font-semibold text-slate-900">{module.month} ({module.title})</span> has been submitted to administration.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs text-left flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Approval in Progress</span>
                Administration verifies payment receipts promptly. As soon as approved, all video lessons, live Zoom links, and tutes for this month will be unlocked on your dashboard.
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
            >
              Return to Portal
            </button>
          </div>
        ) : (
          <>
            {/* Header / Module Details */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{module.batch || 'A/L'}</span>
                <span aria-hidden="true">·</span>
                <span>{module.month} Cohort</span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-700 font-semibold">Monthly Access</span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Unlock {module.title}
              </h2>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 tracking-tight tabular-nums font-mono">
                  Rs. {module.priceLKR.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  / Full Month Curriculum Access
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Paying the monthly fee unlocks all video sessions, live Zoom masterclasses, and downloadable certified tutes for this month.
              </p>
            </div>

            {/* Teacher Bank Account Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Teacher &amp; Academy Bank Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Bank</span>
                  <span className="font-semibold text-slate-800">{generalSettings.bankName}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Branch</span>
                  <span className="font-semibold text-slate-800">{generalSettings.branchName}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Account Name</span>
                  <span className="font-semibold text-slate-800">{generalSettings.accountName}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Account Number</span>
                  <span className="font-bold text-blue-700 tracking-wider font-mono">{generalSettings.accountNumber}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                {generalSettings.paymentInstructions}
              </p>
            </div>

            {/* Payment Verification Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Select Your Payment Type
              </label>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentType('bank_transfer')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    paymentType === 'bank_transfer'
                      ? 'bg-white text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bank Deposit / Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('physical_card')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    paymentType === 'physical_card'
                      ? 'bg-white text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Physical Class Card</span>
                </button>
              </div>
            </div>

            {/* Reference Number / Card Barcode Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">
                {paymentType === 'bank_transfer' ? 'Bank Reference / Slip No (Optional)' : 'Physical Card Barcode / Serial Number (Optional)'}
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder={paymentType === 'bank_transfer' ? 'e.g. TXN-8941029' : 'e.g. CARD-2025-8841'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Upload Area for Slip Photo or Stamped Class Card */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {paymentType === 'bank_transfer' ? 'Upload Bank Deposit Slip' : 'Upload Stamped Physical Class Card'}
              </label>

              {slipImage ? (
                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-2">
                  <img
                    src={slipImage}
                    alt="Uploaded verification"
                    className="max-h-48 rounded-xl object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setSlipImage('')}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] text-slate-300 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Receipt image attached. Ready to submit.</span>
                  </span>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors block bg-slate-50/50 hover:bg-blue-50/20">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Click or tap to snap / upload photo
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    PNG, JPG, or PDF up to 8MB
                  </span>
                </label>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Not logged in warning */}
            {!currentUser && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>Please log in or register before submitting payment.</span>
                {onRequireLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequireLogin();
                    }}
                    className="underline font-bold text-amber-900 ml-2"
                  >
                    Log In
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Verification Slip...</span>
                ) : (
                  <>
                    <span>Submit Slip for Admin Approval</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Content is unlocked immediately upon administrator verification.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
