"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, Role } from '@/components/AuthContext';
import NewOrderModal from '@/components/NewOrderModal';
import VerificationModal from '@/components/VerificationModal';
import NewRecipeModal from '@/components/NewRecipeModal';
import {
  Scissors,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shirt,
  Layers,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Shield,
  ArrowRight,
  TrendingUp,
  Package,
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
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState<OrderItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, recipesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/orders'),
        fetch('/api/recipes'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      if (recipesRes.ok) {
        const recipesData = await recipesRes.json();
        setRecipes(recipesData.recipes || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const statusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/80">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending QA Audit
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Verified • Passed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/80">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Rejected • Rework
          </span>
        );
      case 'CUTTING_IN_PROGRESS':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/70 text-blue-300 border border-blue-800/80">
            <Scissors className="w-3.5 h-3.5 text-blue-400" />
            Cutting In Progress
          </span>
        );
    }
  };

  const isSupervisor = user?.role === 'cutting_supervisor';
  const isVerifier = user?.role === 'cutting_verifier';
  const isSewing = user?.role === 'sewing_supervisor';

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
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
              Real-time synchronization between apparel style recipes, fabric roll allocations, cutting piece
              inspections, and sewing line handovers.
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

            {/* Role-Specific Primary CTA */}
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

            {isSewing && (
              <Link
                href="/sewing"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-purple-600/30"
              >
                <Shirt className="w-4 h-4" />
                Review Sewing Handover
              </Link>
            )}
          </div>
        </div>

        {/* User Identity Display */}
        {user && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Signed in as:</span>
              <span className="font-semibold text-white capitalize">
                {user.fullName} ({user.role.replace('_', ' ')})
              </span>
            </div>
          </div>
        )}
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
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{stats?.totalGarments.toLocaleString() || 0}</span> total garment pieces
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
          <div className="text-xs text-amber-400/80 mt-1 flex items-center gap-1 font-medium">
            Requires piece counts & sign-off
          </div>
        </div>

        {/* Ready for Sewing */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Verified (Sewing Ready)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-3">
            {stats ? stats.verified : '...'}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">
            Cleared for production line
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
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Yards cut: {stats?.totalYards || 0} yds</span>
            <span className="text-rose-400">Rejections: {stats?.rejected || 0}</span>
          </div>
        </div>
      </div>

      {/* Main Operational Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Orders List (2 Columns wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Cutting Batches & Verification Queue</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  {orders.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Track fabric roll consumption and component inspection states
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
                            {order.recipe.recipeCode} • {order.recipe.category}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-semibold text-slate-300">
                          {order.targetQty} <span className="text-[10px] text-slate-500 font-normal">pcs</span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-slate-300">
                          {order.actualFabricYds} <span className="text-[10px] text-slate-500 font-normal">yds</span>
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

        {/* Sidebar: Recipes & System Architecture Status */}
        <div className="space-y-6">
          {/* Style Recipe Specifications */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  Apparel Recipes Catalog
                </h3>
                <p className="text-[11px] text-slate-400">Standard fabric consumption & wastage caps</p>
              </div>
              <Link
                href="/recipes"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                All ({recipes.length})
              </Link>
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
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Std: <strong className="text-slate-300">{r.stdFabricYards} yds</strong>
                      </span>
                      <span>
                        Cap: <strong className="text-emerald-400">{r.wastageCap}%</strong>
                      </span>
                      <span>{r.components.length} components</span>
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

      {/* Interactive Modals */}
      {orderModalOpen && (
        <NewOrderModal
          recipes={recipes}
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

      {recipeModalOpen && (
        <NewRecipeModal
          isOpen={recipeModalOpen}
          onClose={() => setRecipeModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

      {selectedOrderForVerification && (
        <VerificationModal
          order={selectedOrderForVerification}
          isOpen={!!selectedOrderForVerification}
          onClose={() => setSelectedOrderForVerification(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
