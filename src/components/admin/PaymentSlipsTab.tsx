import React, { useState } from 'react';
import { 
  PaymentSlip, 
  SlipStatus, 
  PaymentType 
} from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Search, 
  Filter, 
  CreditCard, 
  Upload, 
  Building2, 
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface PaymentSlipsTabProps {
  slips: PaymentSlip[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const PaymentSlipsTab: React.FC<PaymentSlipsTabProps> = ({
  slips,
  onRefresh,
  showToast
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZoomSlip, setSelectedZoomSlip] = useState<PaymentSlip | null>(null);
  const [declineModalSlip, setDeclineModalSlip] = useState<PaymentSlip | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const filteredSlips = slips.filter(slip => {
    const matchStatus = statusFilter === 'all' || slip.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = q === '' ||
      slip.studentName.toLowerCase().includes(q) ||
      slip.studentId.toLowerCase().includes(q) ||
      slip.studentEmail.toLowerCase().includes(q) ||
      slip.month.toLowerCase().includes(q) ||
      slip.batch.toLowerCase().includes(q) ||
      (slip.referenceNo && slip.referenceNo.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const pendingCount = slips.filter(s => s.status === 'pending').length;
  const approvedCount = slips.filter(s => s.status === 'approved').length;
  const declinedCount = slips.filter(s => s.status === 'declined').length;

  const handleApprove = async (slip: PaymentSlip) => {
    setIsProcessing(true);
    try {
      const ok = await supabaseService.approvePaymentSlip(slip.id);
      if (ok) {
        showToast(`Approved! ${slip.month} monthly access unlocked for ${slip.studentName}`);
        onRefresh();
      } else {
        showToast('Failed to approve payment slip.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error approving slip');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineModalSlip) return;
    setIsProcessing(true);
    try {
      const ok = await supabaseService.declinePaymentSlip(declineModalSlip.id, declineReason);
      if (ok) {
        showToast(`Slip declined for ${declineModalSlip.studentName}`);
        setDeclineModalSlip(null);
        setDeclineReason('');
        onRefresh();
      } else {
        showToast('Failed to decline slip.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error declining slip');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header and Summary stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Payment Slip &amp; Physical Card Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Review student payment slips to activate monthly course masterclasses, tutes, and live Zoom links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold">
            {pendingCount} Pending Review
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
            {approvedCount} Approved
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        
        {/* Status segmented filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'approved'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedCount})
          </button>

          <button
            onClick={() => setStatusFilter('declined')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'declined'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Declined ({declinedCount})
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Slips
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, ID, or month..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Slips Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Cohort / Month</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Slip / Receipt</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No payment slips in this category</p>
                    <p className="text-[11px] text-slate-400">Slips submitted by students will appear here for verification.</p>
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => {
                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{slip.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                          <span>{slip.studentId}</span>
                          <span aria-hidden="true">·</span>
                          <span>{slip.studentEmail}</span>
                        </div>
                      </td>

                      {/* Cohort & Month */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{slip.month}</div>
                        <div className="text-[11px] text-slate-500">{slip.batch}</div>
                      </td>

                      {/* Payment Type */}
                      <td className="py-3.5 px-4">
                        {slip.paymentType === 'bank_transfer' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-200/60">
                            <Upload className="w-3 h-3 text-blue-600" />
                            <span>Bank Transfer</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-200/60">
                            <CreditCard className="w-3 h-3 text-indigo-600" />
                            <span>Physical Class Card</span>
                          </span>
                        )}
                        {slip.referenceNo && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {slip.referenceNo}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums font-mono">
                        Rs. {slip.amount.toLocaleString()}
                      </td>

                      {/* Slip preview */}
                      <td className="py-3.5 px-4">
                        {slip.slipImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedZoomSlip(slip)}
                            className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 transition-colors block w-14 h-14 bg-slate-100"
                          >
                            <img
                              src={slip.slipImageUrl}
                              alt="Payment Slip"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No image</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {slip.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                        {slip.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved</span>
                          </span>
                        )}
                        {slip.status === 'declined' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold text-[11px] border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Declined</span>
                            </span>
                            {slip.declineReason && (
                              <p className="text-[10px] text-rose-600 mt-0.5 max-w-[150px] truncate" title={slip.declineReason}>
                                {slip.declineReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {slip.status !== 'approved' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(slip)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {slip.status !== 'declined' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setDeclineModalSlip(slip);
                                setDeclineReason('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Image Fullscreen Zoom Modal */}
      {selectedZoomSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedZoomSlip.studentName} ({selectedZoomSlip.studentId})
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedZoomSlip.month} Access · {selectedZoomSlip.paymentType === 'bank_transfer' ? 'Bank Transfer' : 'Physical Class Card'}
                </p>
              </div>
              <button
                onClick={() => setSelectedZoomSlip(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto flex items-center justify-center bg-slate-950/5 rounded-2xl p-2 border border-slate-200">
              <img
                src={selectedZoomSlip.slipImageUrl}
                alt="Verification Slip"
                className="max-h-[60vh] object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500 font-mono">
                Ref: {selectedZoomSlip.referenceNo || 'None'} · Rs. {selectedZoomSlip.amount.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                {selectedZoomSlip.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleApprove(selectedZoomSlip);
                      setSelectedZoomSlip(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Approve Request Now
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedZoomSlip(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineModalSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Decline Slip for {declineModalSlip.studentName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Specify why this verification cannot be approved.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Decline Reason</label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Deposit slip image is blurry / transaction reference number does not match our bank statement."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalSlip(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDecline}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
