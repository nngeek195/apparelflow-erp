"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import NewOrderModal from '@/components/NewOrderModal';
import VerificationModal from '@/components/VerificationModal';
import NewRecipeModal from '@/components/NewRecipeModal';
import {
  Scissors,
  CheckCircle2,
  XCircle,
  Clock,
  Shirt,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Shield,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface Stats {
  totalOrders: number;
  pendingVerification: number;
  inProgress: number;
  verified: number;
  rejected: number;
  totalRecipes: number;
  avgWastage: number;
  totalYards: number;
  totalGarments: number;
  rejectionRate: number;
}

interface OrderItem {
  id: string;
  orderNo: string;
  targetQty: number;
  fabricRollId: string;
  actualFabricYds: number;
  status: 'CUTTING_IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  recipe: {
    id: string;
    name: string;
    recipeCode: string;
    category: string;
    stdFabricYards: number;
    wastageCap: number;
    components: {
      id: string;
      componentName: string;
      piecesPerGarment: number;
    }[];
  };
  creator: {
    fullName: string;
    email: string;
  };
  items: {
    id: string;
    componentId: string;
    expectedQty: number;
    actualQty: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
    component: {
      componentName: string;
      piecesPerGarment: number;
    };
  }[];
  verificationLog?: {
    id: string;
    decision: string;
    rejectionNote?: string | null;
    wastagePct: number;
    timestamp: string;
    verifier: {
      fullName: string;
    };
  } | null;
}

interface RecipeOption {
  id: string;
  recipeCode: string;
  name: string;
  category: string;
  stdFabricYards: number;
  wastageCap: number;
  components: {
    id: string;
    componentName: string;
    piecesPerGarment: number;
  }[];
}

export default function Dashboard() {
  // 1. Hook into the secure Auth Context
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState<OrderItem | null>(null);

  // 2. Client-Side Authentication Gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      // Prevent fetching if not authenticated
      if (!user) return;

      const [statsRes, ordersRes, recipesRes] = await Promise.all([
        fetch('/api/stats').catch(() => ({ ok: false, json: () => ({}) })),
        fetch('/api/orders').catch(() => ({ ok: false, json: () => ({}) })),
        fetch('/api/recipes').catch(() => ({ ok: false, json: () => ({}) })),
      ]);

      if (statsRes.ok) {
        const statsData = await (statsRes as Response).json();
        setStats(statsData.stats);
      }
      if (ordersRes.ok) {
        const ordersData = await (ordersRes as Response).json();
        setOrders(ordersData.orders || []);
      }
      if (recipesRes.ok) {
        const recipesData = await (recipesRes as Response).json();
        setRecipes(recipesData.recipes || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // 3. Render Secure Loading State
  if (authLoading || (!user && dataLoading)) {
    return (
      <div className="flex-1 w-full min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium tracking-wide text-slate-300">Verifying Secure Session...</p>
        </div>
      </div>
    );
  }

  // 4. Double-check user exists before rendering secure content
  if (!user) return null;

  const statusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/80">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending QA
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/80">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Rejected
          </span>
        );
      case 'CUTTING_IN_PROGRESS':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/70 text-blue-300 border border-blue-800/80">
            <Scissors className="w-3.5 h-3.5 text-blue-400" />
            In Progress
          </span>
        );
    }
  };

  // Assuming you are mapping Firebase custom claims to standard roles in AuthContext later
  const isSupervisor = true; // Temporary bypass for admin until Prisma roles are mapped
  const isVerifier = true; 
  const isSewing = true;

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Welcome & Role Operations Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manufacturing Operations Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Apparel Operations & Quality Verification
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Real-time synchronization between apparel style recipes, fabric roll allocations, cutting piece inspections, and sewing line handovers.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {isSupervisor && (
              <>
                <button
                  onClick={() => setRecipeModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-semibold text-xs flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  New Recipe
                </button>
                <button
                  onClick={() => setOrderModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-blue-600/30"
                >
                  <Scissors className="w-4 h-4" />
                  Create Cutting Order
                </button>
              </>
            )}

            {isVerifier && (
              <Link
                href="/verification"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                Open QA Workbench
              </Link>
            )}
          </div>
        </div>

        {/* User Identity Display */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Securely signed in as:</span>
            <span className="font-semibold text-white">
              {user.email} (System Admin)
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Batches Cut
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-3">
            {stats ? stats.totalOrders : '...'}
          </div>
        </div>

        {/* Pending QA */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending QA Audit
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-3">
            {stats ? stats.pendingVerification : '...'}
          </div>
        </div>

        {/* Ready for Sewing */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Verified 
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-3">
            {stats ? stats.verified : '...'}
          </div>
        </div>

        {/* Average Wastage % */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avg Fabric Wastage
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-3">
            {stats ? `${stats.avgWastage}%` : '...'}
          </div>
        </div>
      </div>

      {/* Main Operational Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Cutting Batches & Verification Queue</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  {orders.length}
                </span>
              </h2>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Order / Batch</th>
                    <th className="px-5 py-3.5">Style Recipe</th>
                    <th className="px-5 py-3.5 text-right">Target Qty</th>
                    <th className="px-5 py-3.5 text-right">Actual Yards</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No cutting orders recorded. Click &quot;Create Cutting Order&quot; to initiate a batch.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-850/40 transition">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-white text-xs">{order.orderNo}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            Roll: {order.fabricRollId}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-200">{order.recipe.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {order.recipe.recipeCode}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-semibold text-slate-300">
                          {order.targetQty}
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-slate-300">
                          {order.actualFabricYds}
                        </td>
                        <td className="px-5 py-4 text-center">{statusBadge(order.status)}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedOrderForVerification(order)}
                            className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold text-xs transition"
                          >
                            {order.status === 'PENDING_VERIFICATION' ? 'Audit QA' : 'View Audit'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Recipes */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  Apparel Recipes Catalog
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {recipes.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
                  No recipes registered yet. Define your first style recipe to get started.
                </div>
              ) : (
                recipes.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span className="truncate">{r.name}</span>
                      <span className="text-indigo-400 font-mono text-[11px]">{r.recipeCode}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {isSupervisor && (
              <button
                onClick={() => setRecipeModalOpen(true)}
                className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-xs font-medium text-slate-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Define New Style Recipe
              </button>
            )}
          </div>
        </div>
      </div>

      {orderModalOpen && (
        <NewOrderModal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
        />
      )}

      {recipeModalOpen && (
        <NewRecipeModal
          isOpen={recipeModalOpen}
          onClose={() => setRecipeModalOpen(false)}
        />
      )}

      {selectedOrderForVerification && (
        <VerificationModal
          isOpen={!!selectedOrderForVerification}
          onClose={() => setSelectedOrderForVerification(null)}
        />
      )}
    </div>
  );
}