'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import {
  Shirt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Scissors,
  Check,
  UserCheck,
  Play,
  Layers,
  Sparkles,
  X,
  ShieldCheck,
  Gauge,
} from 'lucide-react';

interface ComponentItem {
  id: string;
  expectedQty: number;
  actualQty: number;
  status: string;
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
  updatedAt: string;
  recipe: {
    id: string;
    name: string;
    recipeCode: string;
    category: string;
    stdFabricYards: number;
    wastageCap: number;
  };
  items: ComponentItem[];
  verificationLog?: {
    id: string;
    verifierName?: string | null;
    verifierId?: string;
    decision: string;
    rejectionNote?: string | null;
    wastagePct: number;
    timestamp: string;
  } | null;
}

export default function SewingSupervisorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assembly Launch Modal State
  const [selectedBatchForAssembly, setSelectedBatchForAssembly] = useState<OrderItem | null>(null);
  const [assemblyLine, setAssemblyLine] = useState('Assembly Line Alpha (Station 1-8)');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [clearedBatches, setClearedBatches] = useState<string[]>([]);
  const [launchSuccess, setLaunchSuccess] = useState<string | null>(null);

  const rawRole = user?.role || '';
  const role = rawRole.toUpperCase();
  const isAuthorized = role === 'SEWING_SUPERVISOR' || role === 'ADMIN';

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
      // Enforced Database Query Isolation endpoint (WHERE status = 'VERIFIED')
      const res = await fetch('/api/sewing/queue');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load sewing queue:', err);
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

  // Start Assembly Action: Clears batch for machine operators
  const handleConfirmAssemblyStart = () => {
    if (!selectedBatchForAssembly) return;

    setClearedBatches((prev) => [...prev, selectedBatchForAssembly.id]);
    setLaunchSuccess(
      `Batch ${selectedBatchForAssembly.orderNo} cleared and assigned to ${assemblyLine}!`
    );

    setTimeout(() => {
      setLaunchSuccess(null);
    }, 4500);

    setSelectedBatchForAssembly(null);
  };

  const visibleOrders = orders.filter((o) => !clearedBatches.includes(o.id));

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex-1 min-h-[85vh] flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-sm font-semibold text-slate-700">Loading Sewing Floor Station...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex-1 w-full bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner (Light + Amber/Purple Accent) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50/70 via-white to-purple-50/50 border border-amber-200 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <Shirt className="w-3.5 h-3.5 text-amber-600" />
              <span>Sewing Assembly Line Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Sewing Supervisor Dashboard
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Assembly floor queue, immutable QC verification audit handoffs, fabric wastage telemetry, and line clearance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {launchSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{launchSuccess}</span>
        </div>
      )}

      {/* Queue Statistics (Clean White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verified Queue Depth
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-3">
            {visibleOrders.length}
            <span className="text-xs font-normal text-slate-500 ml-2">batches ready</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Isolated strictly to passed cutting orders
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Garments Ready
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-900 font-mono mt-3">
            {visibleOrders.reduce((sum, o) => sum + o.targetQty, 0)}
            <span className="text-xs font-normal text-slate-500 ml-2">units</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Cleared for final sewing machine assembly
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Assembly Clearances
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-3">
            {clearedBatches.length}
            <span className="text-xs font-normal text-slate-500 ml-2">in production</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Batches cleared today by the sewing supervisor
          </div>
        </div>
      </div>

      {/* Verified Sewing Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <span>Verified Sewing Queue</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-mono font-bold">
                {visibleOrders.length} pending assembly
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exclusively displays orders in VERIFIED state (enforced via database query isolation)
            </p>
          </div>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-white shadow-2xs">
            <Shirt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Assembly Queue Clear</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No verified batches are currently waiting. When the Cutting Verifier approves an order, it will instantly appear in this queue.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {visibleOrders.map((order) => {
              const wastagePct = order.verificationLog?.wastagePct ?? 0;
              const wastageCap = order.recipe.wastageCap;
              const isOverWastage = wastagePct > wastageCap;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-amber-300 transition"
                >
                  <div className="space-y-5">
                    
                    {/* Order Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 mb-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          QC Certified Passed
                        </div>
                        <h3 className="text-xl font-black text-slate-900 font-mono">{order.orderNo}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.recipe.name} <span className="text-purple-700 font-mono font-semibold">({order.recipe.recipeCode})</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-black text-slate-900 font-mono">{order.targetQty}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Garments</div>
                      </div>
                    </div>

                    {/* Immutable Audit Trail Card */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 text-xs">
                        <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Immutable Audit Trail
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Roll: {order.fabricRollId}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block font-semibold">QC Verifier</span>
                          <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                            {order.verificationLog?.verifierName || 'Certified Verifier'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block font-semibold">Audit Timestamp</span>
                          <span className="font-mono text-slate-700 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {order.verificationLog?.timestamp
                              ? new Date(order.verificationLog.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : 'Just now'}
                          </span>
                        </div>
                      </div>

                      {/* Wastage Analytics Indicator */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-700">Fabric Wastage Rate:</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOverWastage ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              {wastagePct}% (Exceeds {wastageCap}% cap)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              {wastagePct}% (Under {wastageCap}% cap)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Component Manifest Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Component Piece Manifest ({order.items.length} parts)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-700 truncate font-medium">
                              {item.component.componentName}
                            </span>
                            <span className="font-mono font-bold text-emerald-700 ml-2 shrink-0">
                              {item.actualQty} pcs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* "Start Assembly" Action Trigger */}
                  <div className="pt-6">
                    <button
                      onClick={() => setSelectedBatchForAssembly(order)}
                      className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>Start Assembly • Clear for Operators</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* "Start Assembly" Action Clearance Modal */}
      {selectedBatchForAssembly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Clear Batch for Sewing Floor</h3>
                  <p className="text-xs text-slate-500 font-mono">Batch: {selectedBatchForAssembly.orderNo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBatchForAssembly(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Target Garment Quantity
                </span>
                <span className="text-lg font-black font-mono text-purple-900">
                  {selectedBatchForAssembly.targetQty} units ({selectedBatchForAssembly.recipe.name})
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  Designated Sewing Assembly Line
                </label>
                <select
                  value={assemblyLine}
                  onChange={(e) => setAssemblyLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-800 text-xs transition outline-none"
                >
                  <option value="Assembly Line Alpha (Station 1-8)">Assembly Line Alpha (Station 1-8)</option>
                  <option value="Assembly Line Beta (Station 9-16)">Assembly Line Beta (Station 9-16)</option>
                  <option value="Assembly Line Gamma - Rapid Stitch (17-24)">
                    Assembly Line Gamma - Rapid Stitch (17-24)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  Supervisor Notes to Floor Operators (Optional)
                </label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="e.g. Standard stitch density 12 SPI, double-needle reinforcement on cuffs..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs placeholder-slate-400 font-mono outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedBatchForAssembly(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssemblyStart}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Confirm & Release to Floor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}