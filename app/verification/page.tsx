'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  X,
  FileCheck,
  RotateCcw,
} from 'lucide-react';

interface VerificationComponent {
  id: string;
  expectedQty: number;
  actualQty: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  component: {
    id: string;
    componentName: string;
    piecesPerGarment: number;
  };
}

interface OrderItem {
  id: string;
  orderNo: string;
  targetQty: number;
  fabricRollId: string;
  actualFabricYds: number;
  status: string;
  createdAt: string;
  recipe: {
    id: string;
    name: string;
    recipeCode: string;
    stdFabricYards: number;
    wastageCap: number;
  };
  items: VerificationComponent[];
}

export default function CuttingVerifierDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Order for Audit Terminal
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [rejectionNote, setRejectionNote] = useState('');
  const [terminalError, setTerminalError] = useState('');
  const [terminalSubmitting, setTerminalSubmitting] = useState(false);

  const rawRole = user?.role || '';
  const role = rawRole.toUpperCase();
  const isAuthorized = role === 'CUTTING_VERIFIER' || role === 'ADMIN';

  // Role Gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAuthorized) {
      router.push('/dashboard');
    }
  }, [user, authLoading, isAuthorized, router]);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const pending = (data.orders || []).filter(
          (o: any) => o.status === 'PENDING_VERIFICATION'
        );
        setOrders(pending);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchQueue();
    }
  }, [isAuthorized, fetchQueue]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQueue();
  };

  const handleOpenTerminal = (order: OrderItem) => {
    setSelectedOrder(order);
    setTerminalError('');
    setRejectionNote('');
    const initialCounts: Record<string, number> = {};
    order.items.forEach((item) => {
      initialCounts[item.id] = item.expectedQty;
    });
    setCounts(initialCounts);
  };

  const handleCountChange = (itemId: string, value: string) => {
    const num = parseInt(value, 10);
    setCounts((prev) => ({
      ...prev,
      [itemId]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  // Traffic Light Indicator Function
  const getItemStatus = (itemId: string, expected: number): 'GREEN' | 'YELLOW' | 'RED' => {
    const actual = counts[itemId] ?? expected;
    if (actual < expected) return 'RED';
    if (actual > expected) return 'YELLOW';
    return 'GREEN';
  };

  // Check if any component in selected batch is short
  const hasShortage = selectedOrder
    ? selectedOrder.items.some((item) => getItemStatus(item.id, item.expectedQty) === 'RED')
    : false;

  // Submit Audit Decision (APPROVED or REJECTED)
  const handleDecisionSubmit = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedOrder) return;
    setTerminalError('');

    if (decision === 'APPROVED' && hasShortage) {
      setTerminalError('HARD STOP VIOLATION: Cannot approve batch with shortages. Clear deficiencies first.');
      return;
    }

    if (decision === 'REJECTED' && !rejectionNote.trim()) {
      setTerminalError('A mandatory rejection note is required to explain defects to the cutting floor.');
      return;
    }

    setTerminalSubmitting(true);

    try {
      const itemsPayload = selectedOrder.items.map((item) => ({
        id: item.id,
        actualQty: counts[item.id] ?? item.expectedQty,
      }));

      const res = await fetch(`/api/orders/${selectedOrder.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionNote: decision === 'REJECTED' ? rejectionNote.trim() : null,
          items: itemsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification audit failed.');
      }

      setSelectedOrder(null);
      await fetchQueue();
    } catch (err: any) {
      setTerminalError(err.message);
    } finally {
      setTerminalSubmitting(false);
    }
  };

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex-1 min-h-[85vh] flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-700">Loading QC Verification Station...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex-1 w-full bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner (Light + Emerald/Purple Accent) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-purple-50/50 border border-emerald-200 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quality Control Checkpoint</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Cutting Verifier Dashboard
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Physical component piece auditing, multi-component traffic-light status validation, and server-enforced hard-stop gatekeeping.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Traffic Light Rules Guide (Light Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-800">GREEN Indicator (Exact Match)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Actual count matches expected piece requirements</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-800">YELLOW Indicator (Surplus)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Surplus cut pieces detected above target specifications</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-800">RED Indicator (Shortage & Hard-Stop)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Strict hard-stop disables sign-off until recut or rejected</div>
          </div>
        </div>
      </div>

      {/* Pending Verification Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <span>Pending Verification Queue</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold">
                {orders.length} awaiting audit
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Incoming batches cleared from cutting tables awaiting physical component counting
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-white shadow-2xs">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Verification Queue Clear</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All cutting orders have been inspected. New batches submitted by the Cutting Supervisor will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Batch Order</span>
                      <h3 className="text-lg font-black text-slate-900 font-mono">{order.orderNo}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Dispatched {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                      Awaiting QA
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 mb-5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Style Recipe:</span>
                      <span className="font-bold text-slate-800">{order.recipe.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Fabric Roll ID:</span>
                      <span className="font-mono text-purple-700 font-bold">{order.fabricRollId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Garments:</span>
                      <span className="font-mono font-bold text-slate-900">{order.targetQty} pcs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Components:</span>
                      <span className="font-mono text-slate-700 font-semibold">{order.items.length} parts</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenTerminal(order)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Launch Interactive Audit Terminal</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Audit Terminal Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Interactive QC Audit Terminal</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Batch: {selectedOrder.orderNo} • Style: {selectedOrder.recipe.name} ({selectedOrder.recipe.recipeCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Audit Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {terminalError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Audit Alert</span>
                    <p className="text-xs text-rose-700">{terminalError}</p>
                  </div>
                </div>
              )}

              {/* Hard Stop Active Warning Banner */}
              {hasShortage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-black text-rose-900 uppercase tracking-wide">
                      Server-Enforced Hard-Stop Engaged
                    </div>
                    <p className="text-xs text-rose-700">
                      Shortage detected in one or more garment components (RED indicator). 
                      The system strictly locks the approval pathway. You must either resolve the piece count or provide a mandatory rejection note and return the batch for recutting.
                    </p>
                  </div>
                </div>
              )}

              {/* Component Pieces Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Component-By-Component Physical Count
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Target: <strong className="text-slate-900">{selectedOrder.targetQty} garments</strong>
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-bold">Garment Component</th>
                        <th className="px-4 py-3 text-right font-bold">Pieces/Garment</th>
                        <th className="px-4 py-3 text-right font-bold">Expected Qty</th>
                        <th className="px-4 py-3 text-center font-bold">Physical Audit Count</th>
                        <th className="px-4 py-3 text-center font-bold">QC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item) => {
                        const status = getItemStatus(item.id, item.expectedQty);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3.5 font-bold text-slate-800">
                              {item.component.componentName}
                            </td>

                            <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                              {item.component.piecesPerGarment}x
                            </td>

                            <td className="px-4 py-3.5 text-right font-mono font-bold text-purple-700">
                              {item.expectedQty} pcs
                            </td>

                            <td className="px-4 py-3.5">
                              <input
                                type="number"
                                min="0"
                                value={counts[item.id] ?? item.expectedQty}
                                onChange={(e) => handleCountChange(item.id, e.target.value)}
                                className={`w-28 mx-auto block px-3 py-1.5 border rounded-lg text-center font-mono font-bold text-sm outline-none transition ${
                                  status === 'RED'
                                    ? 'border-rose-400 text-rose-700 bg-rose-50'
                                    : status === 'YELLOW'
                                    ? 'border-amber-400 text-amber-700 bg-amber-50'
                                    : 'border-emerald-400 text-emerald-700 bg-emerald-50'
                                }`}
                              />
                            </td>

                            <td className="px-4 py-3.5 text-center">
                              {status === 'GREEN' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" /> GREEN
                                </span>
                              )}
                              {status === 'YELLOW' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
                                  <AlertTriangle className="w-3 h-3" /> YELLOW
                                </span>
                              )}
                              {status === 'RED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                                  <XCircle className="w-3 h-3" /> RED (SHORT)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mandatory Rejection Note Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Defect / Rejection Note {hasShortage && <span className="text-rose-600">(Required for Return)</span>}
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Detail physical shortage count, frayed edges, mismatch, or cutting defect..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs placeholder-slate-400 outline-none transition font-mono"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDecisionSubmit('REJECTED')}
                disabled={terminalSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-rose-600 hover:bg-rose-50 border border-rose-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reject & Return to Cutting Table</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionSubmit('APPROVED')}
                disabled={terminalSubmitting || hasShortage}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-md ${
                  hasShortage
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                }`}
                title={hasShortage ? 'Locked: Clear shortages before sign-off' : 'Approve batch for sewing floor'}
              >
                {hasShortage ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                    <span>Hard-Stop Locked (Shortage)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{terminalSubmitting ? 'Recording Audit...' : 'Sign-Off & Approve Batch'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}