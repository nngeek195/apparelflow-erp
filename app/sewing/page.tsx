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

    // Add to cleared batches
    setClearedBatches((prev) => [...prev, selectedBatchForAssembly.id]);
    setLaunchSuccess(
      `Batch ${selectedBatchForAssembly.orderNo} cleared and assigned to ${assemblyLine}!`
    );

    setTimeout(() => {
      setLaunchSuccess(null);
    }, 4500);

    setSelectedBatchForAssembly(null);
  };

  // Filter out locally cleared batches for assembly floor simulation
  const visibleOrders = orders.filter((o) => !clearedBatches.includes(o.id));

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex-1 min-h-[80vh] flex items-center justify-center bg-[#0d0714] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-semibold text-slate-300">Loading Sewing Floor Station...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex-1 w-full bg-[#0d0714] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#21160e] via-[#2d1e13] to-[#160d24] border border-[#4a321e] p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
              <Shirt className="w-3.5 h-3.5 text-amber-400" />
              <span>Sewing Assembly Line Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Sewing Supervisor Dashboard
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Assembly floor queue, immutable QC verification audit handoffs, fabric wastage telemetry, and line clearance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl border border-amber-800/60 bg-[#21160e] hover:bg-[#2d1e13] text-slate-200 text-xs font-bold flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {launchSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs font-bold shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{launchSuccess}</span>
        </div>
      )}

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#160d24] border border-[#372458] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verified Queue Depth
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono mt-3">
            {visibleOrders.length}
            <span className="text-xs font-normal text-slate-400 ml-2">batches ready</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Isolated to strictly audited and passed cutting orders
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#160d24] border border-[#372458] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Garments Ready
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-300 font-mono mt-3">
            {visibleOrders.reduce((sum, o) => sum + o.targetQty, 0)}
            <span className="text-xs font-normal text-slate-400 ml-2">units</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Cleared for stitching and final sewing assembly
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#160d24] border border-[#372458] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Assembly Stations
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono mt-3">
            {clearedBatches.length}
            <span className="text-xs font-normal text-slate-400 ml-2">in production</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Batches cleared today by the sewing supervisor
          </div>
        </div>
      </div>

      {/* Verified Sewing Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <span>Verified Sewing Queue</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                {visibleOrders.length} pending assembly
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exclusively displays orders in VERIFIED state (enforced via database query isolation)
            </p>
          </div>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#372458] rounded-2xl bg-[#160d24]/60">
            <Shirt className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-200">Assembly Queue Clear</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                  className="bg-[#160d24] border border-[#372458] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition"
                >
                  <div className="space-y-5">
                    
                    {/* Order Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          QC Certified Passed
                        </div>
                        <h3 className="text-xl font-black text-white font-mono">{order.orderNo}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {order.recipe.name} <span className="text-amber-400 font-mono">({order.recipe.recipeCode})</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-black text-amber-300 font-mono">{order.targetQty}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Garments</div>
                      </div>
                    </div>

                    {/* Immutable Audit Trail Card */}
                    <div className="p-4 rounded-xl bg-[#0e0917] border border-[#2d1a47] space-y-3">
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#2d1a47] text-xs">
                        <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Immutable Audit Trail
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Roll: {order.fabricRollId}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-slate-500 block font-semibold">QC Verifier</span>
                          <span className="font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            {order.verificationLog?.verifierName || 'Certified Verifier'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase text-slate-500 block font-semibold">Audit Timestamp</span>
                          <span className="font-mono text-slate-300 mt-0.5 flex items-center gap-1.5">
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
                      <div className="pt-3 border-t border-[#2d1a47] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-300">Fabric Wastage Rate:</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOverWastage ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-300 border border-rose-500/40">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              {wastagePct}% (Exceeds {wastageCap}% cap)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              {wastagePct}% (Under {wastageCap}% cap)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Component Manifest Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Component Piece Manifest ({order.items.length} parts)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-lg bg-[#0f091a] border border-[#24153a] flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-300 truncate font-medium">
                              {item.component.componentName}
                            </span>
                            <span className="font-mono font-bold text-emerald-400 ml-2 shrink-0">
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
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-black text-black" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#160d24] border border-[#372458] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#2d1a47]">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Clear Batch for Sewing Floor</h3>
                  <p className="text-xs text-slate-400 font-mono">Batch: {selectedBatchForAssembly.orderNo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBatchForAssembly(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-purple-950/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Target Garment Quantity
                </span>
                <span className="text-lg font-black font-mono text-amber-300">
                  {selectedBatchForAssembly.targetQty} units ({selectedBatchForAssembly.recipe.name})
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  Designated Sewing Assembly Line
                </label>
                <select
                  value={assemblyLine}
                  onChange={(e) => setAssemblyLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d0714] border border-[#372458] focus:border-amber-500 rounded-xl text-white text-xs transition"
                >
                  <option value="Assembly Line Alpha (Station 1-8)">Assembly Line Alpha (Station 1-8)</option>
                  <option value="Assembly Line Beta (Station 9-16)">Assembly Line Beta (Station 9-16)</option>
                  <option value="Assembly Line Gamma - Rapid Stitch (17-24)">
                    Assembly Line Gamma - Rapid Stitch (17-24)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  Supervisor Notes to Floor Operators (Optional)
                </label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="e.g. Standard stitch density 12 SPI, double-needle reinforcement on cuffs..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-[#0d0714] border border-[#372458] focus:border-amber-500 rounded-xl text-white text-xs placeholder-slate-600 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#2d1a47] flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedBatchForAssembly(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssemblyStart}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Confirm & Release to Floor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}