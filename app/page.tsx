'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import {
  Scissors,
  CheckCircle2,
  Shirt,
  Shield,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
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
  todayBatchesCount?: number;
  todayYards?: number;
  todayGarments?: number;
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
  };
  verificationLog?: {
    verifierName?: string | null;
    rejectionNote?: string | null;
    wastagePct?: number;
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

export default function OverallWorkDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const rawRole = user?.role || '';
  const role = rawRole.toUpperCase();
  const isAdmin = role === 'ADMIN';

  // Client-Side Authentication Gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      if (!user) return;

      const [statsRes, ordersRes, recipesRes] = await Promise.all([
        fetch('/api/stats').catch(() => null),
        fetch('/api/orders').catch(() => null),
        fetch('/api/recipes').catch(() => null),
      ]);

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (ordersRes && ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      if (recipesRes && recipesRes.ok) {
        const recipesData = await recipesRes.json();
        setRecipes(recipesData.recipes || []);
      }
    } catch (err) {
      console.error('Failed to load overall dashboard data:', err);
    } finally {
      setLoading(false);
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

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex-1 min-h-[85vh] flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-700" />
          <p className="text-sm font-semibold text-slate-700">Loading ApparelFlow Central Hub...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 w-full bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Central Hub Welcome Banner (Light Canvas with Gold & Purple Accent) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-50 via-white to-amber-50/50 border border-purple-200/80 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Plant-Wide Operations Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Apparel Operations & Overall Work Dashboard
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Central executive hub unifying apparel style recipes, active cutting progress, multi-component QC verifications, and sewing floor clearance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition cursor-pointer"
              title="Refresh plant operations"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Signed In User Status */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Shield className="w-4 h-4 text-purple-700" />
            <span>Authenticated Operator:</span>
            <span className="font-bold text-slate-900 capitalize">
              {user.fullName || user.email}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[10px] font-bold">
              {role.replace('_', ' ')}
            </span>
          </div>

          <span className="text-slate-500 text-[11px] font-medium">
            {isAdmin ? '✨ Supreme Admin Mode (Access to All Departments)' : 'Department Access Scoped'}
          </span>
        </div>
      </div>

      {/* Primary Department Navigation Cards (Clean White Cards) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-700" />
            <span>Departmental Workbenches & Specialized Dashboards</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated operational stations tailored specifically for each departmental administrator
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Cutting Supervisor Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-purple-300 transition shadow-xs flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Scissors className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  /cutting-supervisor
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition">
                  Cutting Supervisor
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Production batch creation, style recipe allocation, fabric roll consumption, and active cutting tables.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-purple-800 font-bold">
                Active Cutting: <strong>{stats?.inProgress || 0} batches</strong>
              </div>
            </div>

            <div className="pt-5">
              <Link
                href="/cutting-supervisor"
                className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <span>Launch Cutting Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Cutting Verifier Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition shadow-xs flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  /verification
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition">
                  Cutting Verifier QC
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Physical component piece auditing, real-time traffic light validation, and server-enforced hard stops.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-emerald-800 font-bold">
                Pending QC: <strong>{stats?.pendingVerification || 0} batches</strong>
              </div>
            </div>

            <div className="pt-5">
              <Link
                href="/verification"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <span>Launch QC Station</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 3. Sewing Supervisor Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-amber-300 transition shadow-xs flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Shirt className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  /sewing
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition">
                  Sewing Supervisor
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Isolated verified queue, immutable audit trail handoffs, fabric wastage analytics, and assembly clearance.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-amber-800 font-bold">
                Verified Ready: <strong>{stats?.verified || 0} batches</strong>
              </div>
            </div>

            <div className="pt-5">
              <Link
                href="/sewing"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <span>Launch Sewing Floor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4. Supreme Admin Card */}
          <div className="p-5 rounded-3xl bg-white border border-purple-200 hover:border-purple-300 transition shadow-xs flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                  /admin
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition">
                  Supreme Admin
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Global macro oversight, cross-department state machine tracker, recipe governance, and staff administration.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-purple-800 font-bold">
                Total Orders: <strong>{stats?.totalOrders || 0} batches</strong>
              </div>
            </div>

            <div className="pt-5">
              <Link
                href="/admin"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-xs"
              >
                <span>Launch Supreme Control</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Telemetry (Clean White Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Batches Cut</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-3">
            {stats?.totalOrders || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            {stats?.totalGarments.toLocaleString() || 0} total garment pieces
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending QA Audit</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono mt-3">
            {stats?.pendingVerification || 0}
          </div>
          <div className="text-xs text-amber-700 mt-1 font-medium">Awaiting physical component count</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified (Assembly Ready)</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-3">
            {stats?.verified || 0}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">Cleared for sewing machines</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Fabric Wastage</span>
          <div className="text-2xl sm:text-3xl font-black text-purple-900 font-mono mt-3">
            {stats?.avgWastage || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1 flex justify-between">
            <span>Rejections: <strong className="text-rose-600">{stats?.rejected || 0}</strong></span>
            <span>Rate: <strong className="text-amber-700 font-bold">{stats?.rejectionRate || 0}%</strong></span>
          </div>
        </div>
      </div>

      {/* Live Order Activity & Recipes Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Production Batches (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Recent Production Batches Stream</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono font-bold">
                  {orders.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Order progress through the manufacturing state machine</p>
            </div>

            <Link
              href="/admin"
              className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
            >
              All Orders in Tracker <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Batch</th>
                    <th className="px-5 py-3.5">Style Recipe</th>
                    <th className="px-5 py-3.5 text-right">Target Qty</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        No cutting batches initiated yet.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-mono font-bold text-slate-900">{order.orderNo}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Roll: {order.fabricRollId}</div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800">{order.recipe.name}</div>
                          <div className="text-[10px] text-purple-700 font-mono font-semibold">{order.recipe.recipeCode}</div>
                        </td>

                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                          {order.targetQty} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          {order.status === 'CUTTING_IN_PROGRESS' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Cutting
                            </span>
                          )}
                          {order.status === 'PENDING_VERIFICATION' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              QA Audit
                            </span>
                          )}
                          {order.status === 'VERIFIED' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              Verified
                            </span>
                          )}
                          {order.status === 'REJECTED' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                              Rejected
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={
                              order.status === 'PENDING_VERIFICATION'
                                ? '/verification'
                                : order.status === 'VERIFIED'
                                ? '/sewing'
                                : '/cutting-supervisor'
                            }
                            className="text-xs text-purple-700 hover:text-purple-900 font-bold"
                          >
                            Inspect &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recipes & Quick Switcher Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              Standard Production Recipes
            </h3>

            <div className="space-y-2.5">
              {recipes.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{r.name}</span>
                    <span className="font-mono text-purple-700 text-[11px] font-semibold">{r.recipeCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Std: <strong className="text-slate-800">{r.stdFabricYards} yds</strong></span>
                    <span>Cap: <strong className="text-emerald-700">{r.wastageCap}%</strong></span>
                    <span>{r.components.length} parts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Evaluator Role Switcher */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
          </div>
        </div>
      </div>
    </div>
  );
}