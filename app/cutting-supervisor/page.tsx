'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import {
  Scissors,
  Plus,
  RefreshCw,
  AlertTriangle,
  Send,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface RecipeComponent {
  id: string;
  componentName: string;
  piecesPerGarment: number;
}

interface Recipe {
  id: string;
  recipeCode: string;
  name: string;
  category: string;
  stdFabricYards: number;
  wastageCap: number;
  components: RecipeComponent[];
}

interface OrderItem {
  id: string;
  orderNo: string;
  targetQty: number;
  fabricRollId: string;
  actualFabricYds: number;
  status: 'CUTTING_IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  recipe: Recipe;
  creatorName?: string | null;
  verificationLog?: {
    verifierName?: string | null;
    rejectionNote?: string | null;
    wastagePct?: number;
    timestamp: string;
  } | null;
}

interface Stats {
  todayBatchesCount: number;
  todayYards: number;
  todayGarments: number;
  totalOrders: number;
  inProgress: number;
  rejected: number;
}

export default function CuttingSupervisorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Batch Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRecipeId, setModalRecipeId] = useState('');
  const [modalTargetQty, setModalTargetQty] = useState<number | ''>('');
  const [modalFabricRollId, setModalFabricRollId] = useState('');
  const [modalActualFabricYds, setModalActualFabricYds] = useState<number | ''>('');
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Order Action State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const rawRole = user?.role || '';
  const role = rawRole.toUpperCase();
  const isAuthorized = role === 'CUTTING_SUPERVISOR' || role === 'ADMIN';

  // Role Gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAuthorized) {
      router.push('/dashboard');
    }
  }, [user, authLoading, isAuthorized, router]);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, recipesRes, statsRes] = await Promise.all([
        fetch('/api/orders').catch(() => null),
        fetch('/api/recipes').catch(() => null),
        fetch('/api/stats').catch(() => null),
      ]);

      if (ordersRes && ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }

      if (recipesRes && recipesRes.ok) {
        const data = await recipesRes.json();
        setRecipes(data.recipes || []);
      }

      if (statsRes && statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load cutting data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Submit New Batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!modalRecipeId || !modalTargetQty || !modalFabricRollId || !modalActualFabricYds) {
      setModalError('Please complete all batch fields.');
      return;
    }

    if (Number(modalTargetQty) <= 0 || Number(modalActualFabricYds) <= 0) {
      setModalError('Target quantity and fabric yards must be greater than zero.');
      return;
    }

    setModalSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: modalRecipeId,
          targetQty: Number(modalTargetQty),
          fabricRollId: modalFabricRollId.trim(),
          actualFabricYds: Number(modalActualFabricYds),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate cutting batch');

      // Reset modal
      setModalRecipeId('');
      setModalTargetQty('');
      setModalFabricRollId('');
      setModalActualFabricYds('');
      setIsModalOpen(false);

      await fetchData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Dispatch Batch to QA Verification
  const handleSendToQA = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING_VERIFICATION' }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to send batch to QA: ${data.error || 'Unknown error'}`);
      } else {
        await fetchData();
      }
    } catch (err: any) {
      alert(`Error updating order: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter Active Cutting Table: orders currently in CUTTING_IN_PROGRESS or REJECTED
  const activeCuttingOrders = orders.filter(
    (o) => o.status === 'CUTTING_IN_PROGRESS' || o.status === 'REJECTED'
  );

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex-1 min-h-[85vh] flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-700" />
          <p className="text-sm font-semibold text-slate-700">Loading Cutting Workshop...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex-1 w-full bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner (Light + Purple/Gold Accent) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-50 via-white to-amber-50/50 border border-purple-200/80 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Scissors className="w-3.5 h-3.5 text-purple-600" />
              <span>Cutting Floor Control Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Cutting Supervisor Dashboard
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Production batch creation, fabric roll allocations, active cut piece tracking, and QA verification dispatching.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition cursor-pointer"
              title="Refresh production orders"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-700' : ''}`} />
            </button>

            {/* Modal Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Initiate New Cutting Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Banner (Clean White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Batches Cut Today */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Batches Cut Today
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-3">
            {stats ? stats.todayBatchesCount : 0}
            <span className="text-xs font-normal text-slate-500 ml-2">batches</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-purple-700 font-bold">{stats?.totalOrders || 0}</span> all-time total batches
          </div>
        </div>

        {/* Total Yards Consumed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Yards Consumed Today
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-800 font-mono mt-3">
            {stats ? stats.todayYards : 0}
            <span className="text-xs font-normal text-slate-500 ml-2">yards</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Raw textile roll consumption on active tables
          </div>
        </div>

        {/* Active Cutting Throughput */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Cutting Throughput
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-3">
            {stats ? stats.todayGarments : 0}
            <span className="text-xs font-normal text-slate-500 ml-2">garments</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>In-progress: <strong className="text-purple-700">{stats?.inProgress || 0}</strong></span>
            <span>Rework/Rejected: <strong className="text-rose-600">{stats?.rejected || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Active Cutting Table (Clean White Table) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <span>Active Cutting Table</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold">
                {activeCuttingOrders.length} active
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time work orders in progress or returned by QA for component rework
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-4">Batch Number</th>
                  <th className="px-5 py-4">Style Recipe</th>
                  <th className="px-5 py-4 text-center">Fabric Roll ID</th>
                  <th className="px-5 py-4 text-right">Target Qty</th>
                  <th className="px-5 py-4 text-right">Actual Yards</th>
                  <th className="px-5 py-4 text-center">Current Status</th>
                  <th className="px-5 py-4 text-right">Cutting Floor Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeCuttingOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <Scissors className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No active batches on the cutting table.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click &quot;Initiate New Cutting Batch&quot; above to start cutting garments.
                      </p>
                    </td>
                  </tr>
                ) : (
                  activeCuttingOrders.map((order) => {
                    const isRejected = order.status === 'REJECTED';
                    return (
                      <React.Fragment key={order.id}>
                        <tr className={`hover:bg-slate-50/80 transition ${isRejected ? 'bg-rose-50/40' : ''}`}>
                          <td className="px-5 py-4">
                            <div className="font-mono font-black text-slate-900 text-sm">{order.orderNo}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Created {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-800">{order.recipe.name}</div>
                            <div className="text-[11px] text-purple-700 font-mono mt-0.5 font-semibold">
                              {order.recipe.recipeCode} • {order.recipe.category}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs">
                              {order.fabricRollId}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 text-sm">
                            {order.targetQty} <span className="text-[10px] text-slate-400 font-normal">garments</span>
                          </td>

                          <td className="px-5 py-4 text-right font-mono font-semibold text-amber-700">
                            {order.actualFabricYds} <span className="text-[10px] text-slate-400 font-normal">yds</span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            {isRejected ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                QA Rejected (Rework)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                <Scissors className="w-3.5 h-3.5 text-purple-600" />
                                Cutting In Progress
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleSendToQA(order.id)}
                              disabled={actionLoadingId === order.id}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ml-auto shadow-xs cursor-pointer ${
                                isRejected
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-purple-700 hover:bg-purple-800 text-white'
                              } disabled:opacity-50`}
                            >
                              {actionLoadingId === order.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Dispatching...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{isRejected ? 'Resubmit to QA' : 'Send to QA'}</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Rejection Note from Verifier */}
                        {isRejected && order.verificationLog?.rejectionNote && (
                          <tr className="bg-rose-50/60 border-t border-rose-100">
                            <td colSpan={7} className="px-5 py-3">
                              <div className="p-3.5 rounded-xl bg-white border border-rose-200 flex items-start gap-3 shadow-2xs">
                                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-rose-900 flex items-center gap-2">
                                    <span>Verifier Quality Rejection Feedback</span>
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      Audited by {order.verificationLog.verifierName || 'QC Verifier'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-rose-800 italic font-mono">
                                    &ldquo;{order.verificationLog.rejectionNote}&rdquo;
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Available Recipes Guide (White Cards with Purple Accents) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              Standard Production Recipes
            </h3>
            <p className="text-xs text-slate-500">Available styles for production cutting batch creation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-purple-300 transition space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{r.name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white text-purple-700 border border-slate-200 font-semibold">
                  {r.recipeCode}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 pt-1">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Category</span>
                  <span className="font-semibold text-slate-800">{r.category}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Std Yards/Pc</span>
                  <span className="font-semibold text-slate-800">{r.stdFabricYards} yds</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Wastage Cap</span>
                  <span className="font-semibold text-emerald-700">{r.wastageCap}%</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                Components: <strong className="text-slate-800">{r.components.map((c) => c.componentName).join(', ')}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "Initiate New Cutting Batch" Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Initiate New Cutting Batch</h2>
                  <p className="text-xs text-slate-500">Allocate fabric rolls and launch garment cutting order</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Recipe Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Apparel Style Recipe
                </label>
                <select
                  value={modalRecipeId}
                  onChange={(e) => setModalRecipeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs transition outline-none"
                  required
                >
                  <option value="">Select recipe (Casual Blouse, Crop Top, etc.)...</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.recipeCode}) - Std: {r.stdFabricYards} yds/pc
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Quantity & Fabric Roll ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Target Qty (Garments)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={modalTargetQty}
                    onChange={(e) => setModalTargetQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs font-mono outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Fabric Roll ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ROLL-9021"
                    value={modalFabricRollId}
                    onChange={(e) => setModalFabricRollId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs font-mono outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Actual Fabric Yards Used */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Actual Fabric Cut (Yards)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 185.5"
                  value={modalActualFabricYds}
                  onChange={(e) => setModalActualFabricYds(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs font-mono outline-none transition"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {modalSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Batch...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Batch to Cutting Table</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
