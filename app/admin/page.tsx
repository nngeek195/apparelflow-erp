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
  Layers,
  Clock,
  XCircle,
  X,
  Trash2,
  ExternalLink,
  FileSpreadsheet,
  Edit,
  Save,
  Check,
  Package,
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

interface RecipeComponentItem {
  id?: string;
  componentName: string;
  piecesPerGarment: number;
}

interface RecipeItem {
  id: string;
  recipeCode: string;
  name: string;
  category: string;
  stdFabricYards: number;
  wastageCap: number;
  components: RecipeComponentItem[];
}

export default function SupremeAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter for Cross-Department Tracker
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CUTTING_IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'>('ALL');

  // Staff Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('CUTTING_SUPERVISOR');
  const [userModalError, setUserModalError] = useState('');
  const [userModalSubmitting, setUserModalSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Recipe Modal State (Create and Edit)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeCode, setRecipeCode] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('Blouse');
  const [recipeStdFabricYards, setRecipeStdFabricYards] = useState<number | ''>(1.8);
  const [recipeWastageCap, setRecipeWastageCap] = useState<number | ''>(5.0);
  const [recipeComponents, setRecipeComponents] = useState<{ id?: string; componentName: string; piecesPerGarment: number }[]>([
    { componentName: 'Front Body Panel', piecesPerGarment: 1 },
    { componentName: 'Back Body Panel', piecesPerGarment: 1 },
  ]);
  const [recipeModalError, setRecipeModalError] = useState('');
  const [recipeModalSubmitting, setRecipeModalSubmitting] = useState(false);

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
      const [statsRes, ordersRes, recipesRes, staffRes] = await Promise.all([
        fetch('/api/stats').catch(() => null),
        fetch('/api/orders').catch(() => null),
        fetch('/api/recipes').catch(() => null),
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

      if (recipesRes && recipesRes.ok) {
        const recipesData = await recipesRes.json();
        setRecipes(recipesData.recipes || []);
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

  // Staff Management Actions
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

  // Recipe Management Functions (Create & Edit)
  const handleOpenCreateRecipe = () => {
    setEditingRecipeId(null);
    setRecipeCode(`REC-${Date.now().toString().slice(-4)}`);
    setRecipeName('');
    setRecipeCategory('Blouse');
    setRecipeStdFabricYards(1.8);
    setRecipeWastageCap(5.0);
    setRecipeComponents([
      { componentName: 'Front Body Panel', piecesPerGarment: 1 },
      { componentName: 'Back Body Panel', piecesPerGarment: 1 },
      { componentName: 'Sleeves (Pair)', piecesPerGarment: 2 },
    ]);
    setRecipeModalError('');
    setIsRecipeModalOpen(true);
  };

  const handleOpenEditRecipe = (r: RecipeItem) => {
    setEditingRecipeId(r.id);
    setRecipeCode(r.recipeCode);
    setRecipeName(r.name);
    setRecipeCategory(r.category);
    setRecipeStdFabricYards(r.stdFabricYards);
    setRecipeWastageCap(r.wastageCap);
    setRecipeComponents(
      r.components.map((c) => ({
        id: c.id,
        componentName: c.componentName,
        piecesPerGarment: c.piecesPerGarment,
      }))
    );
    setRecipeModalError('');
    setIsRecipeModalOpen(true);
  };

  const handleAddComponentRow = () => {
    setRecipeComponents((prev) => [
      ...prev,
      { componentName: '', piecesPerGarment: 1 },
    ]);
  };

  const handleRemoveComponentRow = (index: number) => {
    if (recipeComponents.length <= 1) {
      alert('A recipe must have at least one component piece.');
      return;
    }
    setRecipeComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: 'componentName' | 'piecesPerGarment', value: string | number) => {
    setRecipeComponents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecipeModalError('');

    if (!recipeName.trim() || !recipeCode.trim() || recipeStdFabricYards === '' || recipeWastageCap === '') {
      setRecipeModalError('Please fill in all recipe fields.');
      return;
    }

    const validComponents = recipeComponents.filter((c) => c.componentName.trim().length > 0);
    if (validComponents.length === 0) {
      setRecipeModalError('At least one component piece with a valid name is required.');
      return;
    }

    setRecipeModalSubmitting(true);

    try {
      const payload = {
        recipeCode: recipeCode.trim(),
        name: recipeName.trim(),
        category: recipeCategory.trim(),
        stdFabricYards: Number(recipeStdFabricYards),
        wastageCap: Number(recipeWastageCap),
        components: validComponents,
      };

      let res: Response;
      if (editingRecipeId) {
        // Edit existing recipe
        res = await fetch(`/api/recipes/${editingRecipeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new recipe
        res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save apparel style recipe.');
      }

      setIsRecipeModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setRecipeModalError(err.message);
    } finally {
      setRecipeModalSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the recipe "${name}"?`)) return;

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Delete failed: ${data.error || 'Unknown error'}`);
      } else {
        await fetchData();
      }
    } catch (err: any) {
      alert(`Error deleting recipe: ${err.message}`);
    }
  };

  // Filtered orders for tracker
  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex-1 min-h-[85vh] flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-700" />
          <p className="text-sm font-semibold text-slate-700">Loading Supreme Control Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex-1 w-full bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Supreme Control Banner (Light Canvas with Gold & Purple Accents) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-50 via-white to-amber-50/50 border border-purple-200/80 p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Supreme Control Panel • Full Plant Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              System Admin Supreme Dashboard
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Global macro oversight, state machine order tracking across all apparel manufacturing lines, recipe governance, and staff administration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition cursor-pointer"
              title="Refresh plant telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-700' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreateRecipe}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Style Recipe</span>
            </button>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Users className="w-4 h-4 stroke-[2.5]" />
              <span>Provision Staff</span>
            </button>
          </div>
        </div>

        {/* Cross-Department Supreme Navigation Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5 mr-2">
            <Layers className="w-4 h-4 text-purple-700" /> Department Workbenches:
          </span>

          <Link
            href="/cutting-supervisor"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center gap-2 transition shadow-2xs"
          >
            <Scissors className="w-3.5 h-3.5 text-purple-600" />
            <span>Cutting Supervisor Floor</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/verification"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 transition shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cutting Verifier QC Station</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/sewing"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 transition shadow-2xs"
          >
            <Shirt className="w-3.5 h-3.5 text-amber-600" />
            <span>Sewing Supervisor Assembly</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Factory-Wide KPI Banner (Clean White Cards with Gold & Purple Highlights) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Garments Produced */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Garments Produced
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-3">
            {stats?.totalGarments.toLocaleString() || 0}
            <span className="text-xs font-normal text-slate-500 ml-2">units</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Across all active apparel production lines
          </div>
        </div>

        {/* Plant Fabric Wastage */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Plant Average Fabric Wastage
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-900 font-mono mt-3">
            {stats ? `${stats.avgWastage}%` : '0.00%'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Target tolerance cap: <strong className="text-emerald-700">&lt; 6.5%</strong>
          </div>
        </div>

        {/* Rejection & Defect Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Plant Rejection Rate
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700 font-mono mt-3">
            {stats ? `${stats.rejectionRate}%` : '0.0%'}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Rejected: <strong className="text-rose-700">{stats?.rejected || 0}</strong></span>
            <span>Passed: <strong className="text-emerald-700">{stats?.verified || 0}</strong></span>
          </div>
        </div>

        {/* Total Fabric Processed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Fabric Processed
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-3">
            {stats ? stats.totalYards.toLocaleString() : 0}
            <span className="text-xs font-normal text-slate-500 ml-2">yds</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Total cutting batches: <strong className="text-purple-700">{stats?.totalOrders || 0}</strong>
          </div>
        </div>
      </div>

      {/* NEW: Apparel Style Recipe Management Section (Create and Edit Recipes) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              <span>Apparel Style Recipes & Formula Governance</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                {recipes.length} recipes
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin control over garment recipe specifications, standard fabric yardages, wastage caps, and component manifests
            </p>
          </div>

          <button
            onClick={handleOpenCreateRecipe}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Recipe</span>
          </button>
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-purple-300 transition flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{r.name}</h3>
                    <div className="text-[11px] font-mono text-purple-700 font-semibold mt-0.5">
                      {r.recipeCode} • <span className="text-slate-500">{r.category}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700">
                    {r.components.length} parts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 my-2 border-y border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Std Yards / Pc</span>
                    <span className="font-bold font-mono text-slate-800 text-sm">{r.stdFabricYards} yds</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Wastage Cap</span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">{r.wastageCap}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Component Manifest:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {r.components.map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium"
                      >
                        {c.componentName} <strong className="text-purple-700">({c.piecesPerGarment}x)</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recipe Action Buttons (Edit & Delete) */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditRecipe(r)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-purple-50 text-purple-700 border border-slate-200 hover:border-purple-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Recipe</span>
                </button>

                <button
                  onClick={() => handleDeleteRecipe(r.id, r.name)}
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                  title="Delete Recipe"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Departmental Order Tracker (Light Table) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <span>Cross-Departmental Order Tracker</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-mono">
                {orders.length} total orders
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Full lifecycle tracking across the state machine: CUTTING_IN_PROGRESS &rarr; PENDING_VERIFICATION &rarr; VERIFIED / REJECTED
            </p>
          </div>

          {/* State Machine Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-purple-100 text-purple-900 font-bold border border-purple-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('CUTTING_IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'CUTTING_IN_PROGRESS'
                  ? 'bg-purple-100 text-purple-900 font-bold border border-purple-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cutting ({stats?.inProgress || 0})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_VERIFICATION')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'PENDING_VERIFICATION'
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              QA Pending ({stats?.pendingVerification || 0})
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified ({stats?.verified || 0})
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-100 text-rose-900 font-bold border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected ({stats?.rejected || 0})
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
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
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      No orders found matching the selected state filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4">
                          <div className="font-mono font-black text-slate-900 text-sm">{order.orderNo}</div>
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
                          <div className="font-bold text-slate-800">{order.recipe.name}</div>
                          <div className="text-[10px] text-purple-700 font-mono mt-0.5 font-semibold">
                            {order.recipe.recipeCode} • {order.recipe.category}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                            {order.fabricRollId}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                          {order.targetQty} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                        </td>

                        <td className="px-5 py-4 text-right font-mono font-semibold text-amber-700">
                          {order.actualFabricYds} <span className="text-[10px] text-slate-400 font-normal">yds</span>
                        </td>

                        {/* State Machine Status Badge */}
                        <td className="px-5 py-4 text-center">
                          {order.status === 'CUTTING_IN_PROGRESS' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Scissors className="w-3.5 h-3.5 text-purple-600" />
                              1. Cutting In Progress
                            </span>
                          )}
                          {order.status === 'PENDING_VERIFICATION' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              2. Pending QC Audit
                            </span>
                          )}
                          {order.status === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              3. Verified &bull; Passed
                            </span>
                          )}
                          {order.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Rework &bull; Rejected
                            </span>
                          )}
                        </td>

                        {/* Verifier Feedback */}
                        <td className="px-5 py-4 text-right font-mono">
                          {order.verificationLog ? (
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold text-slate-800">
                                {order.verificationLog.verifierName || 'QC Auditor'}
                              </div>
                              {order.verificationLog.rejectionNote && (
                                <div className="text-[10px] text-rose-700 italic max-w-[200px] truncate ml-auto">
                                  &ldquo;{order.verificationLog.rejectionNote}&rdquo;
                                </div>
                              )}
                              {order.verificationLog.wastagePct !== undefined && (
                                <div className="text-[10px] text-slate-500">
                                  Wastage: <span className="text-purple-700 font-bold">{order.verificationLog.wastagePct}%</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No audit yet</span>
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

      {/* User & Role Administration Panel (Light Cards) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-purple-700" />
              <span>User & Role Administration Panel</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                {staffUsers.length} staff
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage departmental staff accounts and dynamically reassign privileges
            </p>
          </div>

          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Staff Account</span>
          </button>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Staff Name & Email</th>
                <th className="px-5 py-3.5">Current Department Role</th>
                <th className="px-5 py-3.5">Reassign Department Role</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {staffUsers.map((member) => (
                <tr key={member.id} className="hover:bg-white transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 text-xs">{member.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{member.email}</div>
                  </td>

                  <td className="px-5 py-4">
                    {member.role === 'ADMIN' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Shield className="w-3 h-3 text-amber-600" />
                        System Admin
                      </span>
                    )}
                    {member.role === 'CUTTING_SUPERVISOR' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Scissors className="w-3.5 h-3.5 text-purple-600" />
                        Cutting Supervisor
                      </span>
                    )}
                    {member.role === 'CUTTING_VERIFIER' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Cutting Verifier
                      </span>
                    )}
                    {member.role === 'SEWING_SUPERVISOR' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Shirt className="w-3.5 h-3.5 text-amber-600" />
                        Sewing Supervisor
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={member.role}
                      disabled={updatingUserId === member.id}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 focus:border-purple-600 rounded-lg text-slate-800 text-xs font-medium outline-none transition cursor-pointer shadow-2xs"
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
                      className="p-2 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
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

      {/* CREATE & EDIT RECIPE MODAL */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingRecipeId ? 'Edit Apparel Style Recipe' : 'Create New Style Recipe'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define standard fabric consumption, tolerances, and component pieces
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-6 overflow-y-auto space-y-5">
              {recipeModalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {recipeModalError}
                </div>
              )}

              {/* Recipe Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Recipe Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REC-BL01"
                    value={recipeCode}
                    onChange={(e) => setRecipeCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs font-mono outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Recipe Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Casual Blouse"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Category, Std Fabric Yards, Wastage Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Blouse, Crop Top, Shirt"
                    value={recipeCategory}
                    onChange={(e) => setRecipeCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Std Yards / Garment
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    placeholder="e.g. 1.8"
                    value={recipeStdFabricYards}
                    onChange={(e) => setRecipeStdFabricYards(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs font-mono outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Wastage Cap (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 5.0"
                    value={recipeWastageCap}
                    onChange={(e) => setRecipeWastageCap(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs font-mono outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Component Manifest Builder */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Garment Component Pieces
                    </label>
                    <p className="text-[11px] text-slate-500">Each piece multiplied by target quantity during cutting</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddComponentRow}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Component</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {recipeComponents.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="e.g. Front Body Panel, Collar, Sleeves"
                          value={comp.componentName}
                          onChange={(e) => handleComponentChange(idx, 'componentName', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-purple-600 rounded-lg text-slate-900 text-xs outline-none"
                          required
                        />
                      </div>

                      <div className="w-32 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Pcs:</span>
                        <input
                          type="number"
                          min="1"
                          value={comp.piecesPerGarment}
                          onChange={(e) => handleComponentChange(idx, 'piecesPerGarment', Number(e.target.value))}
                          className="w-16 px-2.5 py-2 bg-white border border-slate-200 focus:border-purple-600 rounded-lg text-slate-900 text-xs font-mono text-center outline-none"
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveComponentRow(idx)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove component"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recipeModalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{recipeModalSubmitting ? 'Saving Recipe...' : editingRecipeId ? 'Update Recipe' : 'Create Recipe'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Provision New Staff Account</h3>
                  <p className="text-xs text-slate-500">Create login credentials with departmental RBAC</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="py-4 space-y-4">
              {userModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {userModalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elena Rostova"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Staff Email
                </label>
                <input
                  type="email"
                  placeholder="staff@apparelflow.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Department Assignment Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-none transition"
                >
                  <option value="ADMIN">ADMIN (Supreme Admin)</option>
                  <option value="CUTTING_SUPERVISOR">CUTTING_SUPERVISOR (Cutting Room)</option>
                  <option value="CUTTING_VERIFIER">CUTTING_VERIFIER (QC Station)</option>
                  <option value="SEWING_SUPERVISOR">SEWING_SUPERVISOR (Sewing Floor)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userModalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
