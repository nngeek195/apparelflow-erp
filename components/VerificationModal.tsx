"use client";

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  ShieldCheck,
  Scale,
  Send,
  Loader2,
  AlertCircle,
  Check,
  HelpCircle,
} from 'lucide-react';

interface ComponentItem {
  id: string;
  componentId: string;
  expectedQty: number;
  actualQty: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  component: {
    componentName: string;
    piecesPerGarment: number;
  };
}

interface OrderDetail {
  id: string;
  orderNo: string;
  targetQty: number;
  fabricRollId: string;
  actualFabricYds: number;
  status: string;
  recipe: {
    name: string;
    recipeCode: string;
    stdFabricYards: number;
    wastageCap: number;
  };
  items: ComponentItem[];
  verificationLog?: {
    decision: string;
    rejectionNote?: string | null;
    wastagePct: number;
    timestamp: string;
    verifier: {
      fullName: string;
    };
  } | null;
}

interface VerificationModalProps {
  order: OrderDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VerificationModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: VerificationModalProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ComponentItem[]>(order.items);
  const [actualFabricYds, setActualFabricYds] = useState<number>(order.actualFabricYds);
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isVerifier = user?.role === 'cutting_verifier';

  // Calculate live wastage metrics
  const standardFabricYards = order.recipe.stdFabricYards * order.targetQty;
  const wastageYards = actualFabricYds - standardFabricYards;
  const wastagePct = standardFabricYards > 0 ? (wastageYards / standardFabricYards) * 100 : 0;
  const isWastageExceeded = wastagePct > order.recipe.wastageCap;

  // Handle actual quantity adjustments per component
  const handleQtyChange = (itemId: string, newActual: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const expected = item.expectedQty;
          let newStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';

          if (newActual === expected) {
            newStatus = 'GREEN';
          } else if (Math.abs(newActual - expected) / expected <= 0.05) {
            newStatus = 'YELLOW';
          } else {
            newStatus = 'RED';
          }

          return {
            ...item,
            actualQty: newActual,
            status: newStatus,
          };
        }
        return item;
      })
    );
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'REJECTED' && !rejectionNote.trim()) {
      setShowRejectInput(true);
      setErrorMsg('Please enter rejection remarks describing the reason for non-conformance.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            actualQty: i.actualQty,
            expectedQty: i.expectedQty,
            status: i.status,
          })),
          actualFabricYds,
          decision,
          rejectionNote: decision === 'REJECTED' ? rejectionNote : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification submission failed');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Quality Verification Workbench
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300">
                  {order.orderNo}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Style: {order.recipe.name} ({order.recipe.recipeCode}) • Target Batch: {order.targetQty} units
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verifier Role Notice Banner */}
        {!isVerifier && (
          <div className="px-6 py-2.5 bg-amber-950/40 border-b border-amber-900/50 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Read-Only Preview:</strong> You are currently signed in as{' '}
                <span className="capitalize font-semibold underline">{user?.role?.replace('_', ' ')}</span>.
                Only authorized <strong>Cutting Verifiers</strong> can submit approvals or rejections.
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Fabric Consumption & Live Wastage Calculation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Standard Fabric Req.</span>
                <span className="text-[10px] text-slate-500">{order.recipe.stdFabricYards} yds/garment</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {standardFabricYards.toFixed(1)} <span className="text-xs text-slate-400 font-normal">yds</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Target: {order.targetQty} garments
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Actual Cut Fabric</span>
                <span className="text-[10px] text-indigo-400 font-mono">Roll: {order.fabricRollId}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  disabled={!isVerifier}
                  value={actualFabricYds}
                  onChange={(e) => setActualFabricYds(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold font-mono text-base focus:border-indigo-500 focus:outline-none disabled:opacity-75"
                />
                <span className="text-xs text-slate-400">yds</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Variance: {(wastageYards >= 0 ? '+' : '') + wastageYards.toFixed(1)} yds
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                isWastageExceeded
                  ? 'bg-rose-950/30 border-rose-900/60'
                  : 'bg-emerald-950/30 border-emerald-900/60'
              }`}
            >
              <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Fabric Wastage %</span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isWastageExceeded ? 'bg-rose-900/50 text-rose-300' : 'bg-emerald-900/50 text-emerald-300'
                  }`}
                >
                  Cap: {order.recipe.wastageCap.toFixed(1)}%
                </span>
              </div>
              <div
                className={`text-2xl font-black font-mono ${
                  isWastageExceeded ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {wastagePct.toFixed(2)}%
              </div>
              <div className="text-[11px] mt-1 flex items-center gap-1 font-medium">
                {isWastageExceeded ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Exceeds tolerance allowance
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Within acceptable limits
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Recipe Components Physical Count Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Component Inspection Checklist</span>
                <span className="text-xs font-normal text-slate-400">
                  (Physical piece count verification)
                </span>
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Exact Match (GREEN)
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Minor ±5% (YELLOW)
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Deficit (RED)
                </span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Component Name</th>
                    <th className="px-4 py-3 text-center">Pcs / Garment</th>
                    <th className="px-4 py-3 text-right">Expected Qty</th>
                    <th className="px-4 py-3 text-right">Actual Count</th>
                    <th className="px-4 py-3 text-center">Variance</th>
                    <th className="px-4 py-3 text-center">QA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((item) => {
                    const diff = item.actualQty - item.expectedQty;
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition">
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {item.component.componentName}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 font-mono">
                          {item.component.piecesPerGarment}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-300">
                          {item.expectedQty}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            disabled={!isVerifier}
                            value={item.actualQty}
                            onChange={(e) =>
                              handleQtyChange(item.id, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-20 px-2 py-1 text-right bg-slate-900 border border-slate-700 rounded-md text-white font-mono font-bold focus:border-indigo-500 focus:outline-none disabled:opacity-75"
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          <span
                            className={
                              diff === 0
                                ? 'text-slate-400'
                                : diff < 0
                                ? 'text-rose-400 font-bold'
                                : 'text-amber-400 font-bold'
                            }
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'GREEN'
                                ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                                : item.status === 'YELLOW'
                                ? 'bg-amber-950 border border-amber-800 text-amber-300'
                                : 'bg-rose-950 border border-rose-800 text-rose-300'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.status === 'GREEN'
                                  ? 'bg-emerald-400'
                                  : item.status === 'YELLOW'
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                            />
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejection Note Form (Shown when Reject is clicked or active) */}
          {(showRejectInput || order.verificationLog?.rejectionNote) && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/60 space-y-2">
              <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider">
                Rejection Remarks / Quality Non-Conformance Reason:
              </label>
              <textarea
                disabled={!isVerifier || order.status !== 'PENDING_VERIFICATION'}
                rows={3}
                value={rejectionNote || order.verificationLog?.rejectionNote || ''}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Provide detailed reasons for rejection (e.g. missing pieces, damaged cut panels, excessive fabric wastage)..."
                className="w-full p-2.5 bg-slate-950 border border-rose-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {/* Historical Log info if already verified */}
          {order.verificationLog && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <div>
                Verified by <strong className="text-white">{order.verificationLog.verifier.fullName}</strong> on{' '}
                {new Date(order.verificationLog.timestamp).toLocaleString()}
              </div>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  order.verificationLog.decision === 'APPROVED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {order.verificationLog.decision}
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audit confirmation email will be sent automatically upon sign-off</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Close
            </button>

            {isVerifier && order.status === 'PENDING_VERIFICATION' && (
              <>
                <button
                  onClick={() => {
                    if (!showRejectInput) {
                      setShowRejectInput(true);
                    } else {
                      handleDecision('REJECTED');
                    }
                  }}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-200 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Reject Order
                </button>

                <button
                  onClick={() => handleDecision('APPROVED')}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve Order (QA Pass)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
