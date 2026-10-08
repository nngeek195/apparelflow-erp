'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import {
  listStaffUsers,
  updateUserRole,
  createStaffUser,
  deleteUser,
} from '@/app/action/admin';
import {
  Shield,
  Scissors,
  CheckCircle2,
  Shirt,
  TrendingUp,
  AlertTriangle,
  Users,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  XCircle,
  X,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface Stats {
  totalOrders: number;
  totalGarments: number;
  totalYards: number;
  avgWastage: number;
  rejectionRate: number;
  pendingVerification: number;
  inProgress: number;
  verified: number;
  rejected: number;
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
  };
  creatorName?: string | null;
  verificationLog?: {
    verifierName?: string | null;
    rejectionNote?: string | null;
    wastagePct?: number;
    timestamp: string;
  } | null;
}

interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
  lastSignInAt?: string | null;
}

export default function SupremeAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter for Cross-Department Tracker
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CUTTING_IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'>('ALL');

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('CUTTING_SUPERVISOR');
  const [userModalError, setUserModalError] = useState('');
  const [userModalSubmitting, setUserModalSubmitting] = useState(false);

  // Updating user role state
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const rawRole = user?.role || '';
  const role = rawRole.toUpperCase();
  const isAdmin = role === 'ADMIN';

  // Role Gate: Strict ADMIN access
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, authLoading, isAdmin, router]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, staffRes] = await Promise.all([
        fetch('/api/stats').catch(() => null),
        fetch('/api/orders').catch(() => null),
        listStaffUsers().catch(() => ({ success: false, users: [] })),
      ]);

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (ordersRes && ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      if (staffRes && staffRes.success) {
        setStaffUsers(staffRes.users || []);
      }
    } catch (err) {
      console.error('Failed to load Supreme Admin telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Change staff role
  const handleRoleChange = async (userId: string, targetRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await updateUserRole(userId, targetRole);
      if (res.success) {
        await fetchData();
      } else {
        alert(`Failed to update role: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Delete staff member
  const handleDeleteStaff = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this staff user account?')) return;
    try {
      const res = await deleteUser(userId);
      if (res.success) {
        await fetchData();
      } else {
        alert(`Failed to remove staff: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  // Create new staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError('');

    if (!newEmail || !newPassword || !newFullName) {
      setUserModalError('All fields are required.');
      return;
    }

    setUserModalSubmitting(true);
    try {
      const res = await createStaffUser(newEmail.trim(), newPassword, newFullName.trim(), newRole);
      if (!res.success) {
        throw new Error(res.error || 'Failed to create staff member');
      }

      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('CUTTING_SUPERVISOR');
      setIsAddUserOpen(false);

      await fetchData();
    } catch (err: any) {
      setUserModalError(err.message);
    } finally {
      setUserModalSubmitting(false);
    }
  };

  // Filtered orders for tracker
  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex-1 min-h-[80vh] flex items-center justify-center bg-[#0d0714] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-semibold text-slate-300">Loading Supreme Control Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex-1 w-full bg-[#0d0714] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Supreme Control Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#241738] via-[#1a0e2d] to-[#120a1f] border border-amber-500/40 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Supreme Control Panel • Full Plant Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              System Admin Supreme Dashboard
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Global macro oversight, state machine tracking across all apparel manufacturing lines, plant telemetry, and staff role governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-purple-800/60 bg-[#160d24] hover:bg-[#23153b] text-slate-300 hover:text-white transition"
              title="Refresh plant telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black stroke-[3]" />
              <span>Provision Staff Account</span>
            </button>
          </div>
        </div>

        {/* Cross-Department Supreme Navigation Tabs */}
        <div className="mt-6 pt-5 border-t border-purple-900/40 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mr-2">
            <Layers className="w-4 h-4" /> Department Workbenches:
          </span>

          <Link
            href="/cutting-supervisor"
            className="px-3.5 py-1.5 rounded-xl bg-[#1b102b] hover:bg-[#2b1945] border border-purple-700/60 text-purple-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Scissors className="w-3.5 h-3.5 text-purple-400" />
            <span>Cutting Supervisor Floor</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>

          <Link
            href="/verification"
            className="px-3.5 py-1.5 rounded-xl bg-[#102420] hover:bg-[#1a3832] border border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cutting Verifier QC Station</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>

          <Link
            href="/sewing"
            className="px-3.5 py-1.5 rounded-xl bg-[#26180e] hover:bg-[#382415] border border-amber-700/60 text-amber-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Shirt className="w-3.5 h-3.5 text-amber-400" />
            <span>Sewing Supervisor Assembly</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>
        </div>
      </div>

      {/* Factory-Wide KPI Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Garments Produced */}
        <div className="p-5 rounded-2xl bg-[#160d24] border border-[#372458] shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Garments Produced
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono mt-3">
            {stats?.totalGarments.toLocaleString() || 0}
            <span className="text-xs font-normal text-slate-400 ml-2">units</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Across all active apparel production lines
          </div>
        </div>

        {/* Plant Fabric Wastage */}
        <div className="p-5 rounded-2xl bg-[#160d24] border border-[#372458] shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Plant Average Fabric Wastage
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-300 font-mono mt-3">
            {stats ? `${stats.avgWastage}%` : '0.00%'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Standard tolerance limit target: <strong className="text-emerald-400">&lt; 6.5%</strong>
          </div>
        </div>

        {/* Rejection & Defect Rate */}
        <div className="p-5 rounded-2xl bg-[#160d24] border border-[#372458] shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Plant Rejection / Defect Rate
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono mt-3">
            {stats ? `${stats.rejectionRate}%` : '0.0%'}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Rejected: <strong className="text-rose-300">{stats?.rejected || 0}</strong></span>
            <span>Passed: <strong className="text-emerald-400">{stats?.verified || 0}</strong></span>
          </div>
        </div>

        {/* Total Yards Processed */}
        <div className="p-5 rounded-2xl bg-[#160d24] border border-[#372458] shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Fabric Processed
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono mt-3">
            {stats ? stats.totalYards.toLocaleString() : 0}
            <span className="text-xs font-normal text-slate-400 ml-2">yds</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Total rolls cut in factory: <strong className="text-amber-300">{stats?.totalOrders || 0}</strong> batches
          </div>
        </div>
      </div>

      {/* Cross-Departmental Order Tracker */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <span>Cross-Departmental Order Tracker</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                {orders.length} total orders
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Full lifecycle tracking across the state machine: CUTTING_IN_PROGRESS &rarr; PENDING_VERIFICATION &rarr; VERIFIED / REJECTED
            </p>
          </div>

          {/* State Machine Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#160d24] border border-[#372458] text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('CUTTING_IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'CUTTING_IN_PROGRESS'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cutting ({stats?.inProgress || 0})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_VERIFICATION')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'PENDING_VERIFICATION'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              QA Pending ({stats?.pendingVerification || 0})
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Verified ({stats?.verified || 0})
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rejected ({stats?.rejected || 0})
            </button>
          </div>
        </div>

        <div className="border border-[#372458] rounded-2xl bg-[#160d24]/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120a1f] text-slate-400 border-b border-[#372458] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-4">Batch Order</th>
                  <th className="px-5 py-4">Style Recipe</th>
                  <th className="px-5 py-4 text-center">Fabric Roll</th>
                  <th className="px-5 py-4 text-right">Target Qty</th>
                  <th className="px-5 py-4 text-right">Yards Cut</th>
                  <th className="px-5 py-4 text-center">State Machine Lifecycle</th>
                  <th className="px-5 py-4 text-right">Auditor / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a1b44]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      No orders found matching the selected state filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    return (
                      <tr key={order.id} className="hover:bg-[#1f1335]/60 transition">
                        <td className="px-5 py-4">
                          <div className="font-mono font-black text-white text-sm">{order.orderNo}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-200">{order.recipe.name}</div>
                          <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                            {order.recipe.recipeCode} • {order.recipe.category}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="font-mono px-2 py-0.5 rounded bg-[#24173d] text-slate-300 border border-purple-800/40 text-[11px]">
                            {order.fabricRollId}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-mono font-bold text-white">
                          {order.targetQty} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                        </td>

                        <td className="px-5 py-4 text-right font-mono font-semibold text-amber-300">
                          {order.actualFabricYds} <span className="text-[10px] text-slate-400 font-normal">yds</span>
                        </td>

                        {/* State Machine Status Badge */}
                        <td className="px-5 py-4 text-center">
                          {order.status === 'CUTTING_IN_PROGRESS' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/40">
                              <Scissors className="w-3.5 h-3.5 text-purple-400" />
                              1. Cutting In Progress
                            </span>
                          )}
                          {order.status === 'PENDING_VERIFICATION' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              2. Pending QC Audit
                            </span>
                          )}
                          {order.status === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              3. Verified &bull; Passed
                            </span>
                          )}
                          {order.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              Rework &bull; Rejected
                            </span>
                          )}
                        </td>

                        {/* Verifier Feedback */}
                        <td className="px-5 py-4 text-right font-mono">
                          {order.verificationLog ? (
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold text-slate-300">
                                {order.verificationLog.verifierName || 'QC Auditor'}
                              </div>
                              {order.verificationLog.rejectionNote && (
                                <div className="text-[10px] text-rose-300 italic max-w-[200px] truncate ml-auto">
                                  &ldquo;{order.verificationLog.rejectionNote}&rdquo;
                                </div>
                              )}
                              {order.verificationLog.wastagePct !== undefined && (
                                <div className="text-[10px] text-slate-400">
                                  Wastage: <span className="text-amber-300 font-bold">{order.verificationLog.wastagePct}%</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">No audit yet</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User & Role Administration Panel */}
      <div className="p-6 rounded-2xl bg-[#160d24] border border-[#372458] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <Users className="w-5 h-5 text-amber-400" />
              <span>User & Role Administration Panel</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                {staffUsers.length} staff
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage departmental staff accounts and dynamically reassign privileges
            </p>
          </div>

          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#24173d] hover:bg-[#311f52] border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Staff Account</span>
          </button>
        </div>

        <div className="border border-[#2e1d49] rounded-xl overflow-hidden bg-[#0e0917]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#120a1f] text-slate-400 border-b border-[#2e1d49] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Staff Name & Email</th>
                <th className="px-5 py-3.5">Current Department Role</th>
                <th className="px-5 py-3.5">Reassign Department Role</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24173d]">
              {staffUsers.map((member) => (
                <tr key={member.id} className="hover:bg-[#1a112c]/40 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-white text-xs">{member.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{member.email}</div>
                  </td>

                  <td className="px-5 py-4">
                    {member.role === 'ADMIN' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                        <Shield className="w-3 h-3 text-amber-400" />
                        System Admin
                      </span>
                    )}
                    {member.role === 'CUTTING_SUPERVISOR' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/40">
                        <Scissors className="w-3 h-3 text-purple-400" />
                        Cutting Supervisor
                      </span>
                    )}
                    {member.role === 'CUTTING_VERIFIER' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Cutting Verifier
                      </span>
                    )}
                    {member.role === 'SEWING_SUPERVISOR' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-700/60">
                        <Shirt className="w-3 h-3 text-amber-400" />
                        Sewing Supervisor
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={member.role}
                      disabled={updatingUserId === member.id}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="px-3 py-1.5 bg-[#160d24] border border-[#372458] focus:border-amber-500 rounded-lg text-white text-xs font-medium outline-none transition cursor-pointer"
                    >
                      <option value="ADMIN">ADMIN (Supreme Admin)</option>
                      <option value="CUTTING_SUPERVISOR">CUTTING_SUPERVISOR</option>
                      <option value="CUTTING_VERIFIER">CUTTING_VERIFIER</option>
                      <option value="SEWING_SUPERVISOR">SEWING_SUPERVISOR</option>
                    </select>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                      title="Remove staff account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Member Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#160d24] border border-[#372458] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#2d1a47]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Provision New Staff Account</h3>
                  <p className="text-xs text-slate-400">Create login credentials with departmental RBAC</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-purple-950/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="py-4 space-y-4">
              {userModalError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  {userModalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elena Rostova"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d0714] border border-[#372458] focus:border-amber-500 rounded-xl text-white text-xs outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Staff Email
                </label>
                <input
                  type="email"
                  placeholder="staff@apparelflow.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d0714] border border-[#372458] focus:border-amber-500 rounded-xl text-white text-xs outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d0714] border border-[#372458] focus:border-amber-500 rounded-xl text-white text-xs outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Department Assignment Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d0714] border border-[#372458] focus:border-amber-500 rounded-xl text-white text-xs outline-none transition"
                >
                  <option value="ADMIN">ADMIN (Supreme Admin)</option>
                  <option value="CUTTING_SUPERVISOR">CUTTING_SUPERVISOR (Cutting Room)</option>
                  <option value="CUTTING_VERIFIER">CUTTING_VERIFIER (QC Station)</option>
                  <option value="SEWING_SUPERVISOR">SEWING_SUPERVISOR (Sewing Floor)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#2d1a47] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userModalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {userModalSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
