"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, Role } from '@/components/AuthContext';
import NewOrderModal from '@/components/NewOrderModal';
import VerificationModal from '@/components/VerificationModal';
import {
  Scissors,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Eye,
  Layers,
  ArrowUpDown,
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
  items: ComponentItem[];
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

export default function OrdersPage() {
  const { user, switchRole } = useAuth();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState<OrderDetail | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      let url = '/api/orders';
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const [res, recRes] = await Promise.all([
        fetch(url),
        fetch('/api/recipes'),
      ]);

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecipes(recData.recipes || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const isSupervisor = user?.role === 'cutting_supervisor';

  const statusBadge = (status: OrderDetail['status']) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/80">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending QA Verification
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
            Rejected • Non-Conformance
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

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Scissors className="w-6 h-6 text-indigo-400" />
              Cutting Orders Management
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-mono">
              {orders.length} batches
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch fabric rolls into cutting batches, track piece counts, and initiate QA audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {isSupervisor ? (
            <button
              onClick={() => setOrderModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
            >
              <Plus className="w-4 h-4" /> Create Cutting Order
            </button>
          ) : (
            <button
              onClick={() => switchRole('cutting_supervisor')}
              className="px-4 py-2.5 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 font-semibold text-xs flex items-center gap-2 transition"
              title="Switch to Cutting Supervisor to create orders"
            >
              <span>✂️</span> Switch to Supervisor to Add Order
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Order #, Fabric Roll ID, or Style Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'CUTTING_IN_PROGRESS'].map(
            (tab) => {
              const labelMap: Record<string, string> = {
                ALL: 'All Orders',
                PENDING_VERIFICATION: 'Pending QA',
                VERIFIED: 'Verified',
                REJECTED: 'Rejected',
                CUTTING_IN_PROGRESS: 'In Progress',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    statusFilter === tab
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {labelMap[tab]}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Order No</th>
                <th className="px-5 py-3.5">Apparel Recipe</th>
                <th className="px-5 py-3.5 text-center">Batch Target</th>
                <th className="px-5 py-3.5 text-center">Fabric Roll Lot</th>
                <th className="px-5 py-3.5 text-right">Cut Fabric (yds)</th>
                <th className="px-5 py-3.5 text-center">Inspection Items</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    Loading cutting orders from Cloud SQL database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No orders matched the current filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const standardFabric = order.recipe.stdFabricYards * order.targetQty;
                  const varianceYds = order.actualFabricYds - standardFabric;
                  const wastagePct = standardFabric > 0 ? (varianceYds / standardFabric) * 100 : 0;

                  return (
                    <tr key={order.id} className="hover:bg-slate-850/40 transition">
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-white text-xs">{order.orderNo}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">{order.recipe.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {order.recipe.recipeCode} ({order.recipe.category})
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-mono font-semibold text-white">
                        {order.targetQty} <span className="text-[10px] text-slate-500 font-normal">pcs</span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {order.fabricRollId}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right font-mono">
                        <div className="text-slate-200 font-semibold">{order.actualFabricYds} yds</div>
                        <div
                          className={`text-[10px] ${
                            wastagePct > order.recipe.wastageCap ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {wastagePct >= 0 ? `+${wastagePct.toFixed(1)}%` : `${wastagePct.toFixed(1)}%`} waste
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {order.items.map((item) => (
                            <span
                              key={item.id}
                              title={`${item.component.componentName}: ${item.actualQty}/${item.expectedQty} (${item.status})`}
                              className={`h-2.5 w-2.5 rounded-full ${
                                item.status === 'GREEN'
                                  ? 'bg-emerald-500'
                                  : item.status === 'YELLOW'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {order.items.length} components
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">{statusBadge(order.status)}</td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrderForVerification(order)}
                          className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 ml-auto transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{order.status === 'PENDING_VERIFICATION' ? 'Audit' : 'Details'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Modals */}
      {orderModalOpen && (
        <NewOrderModal
          recipes={recipes}
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          onSuccess={fetchOrders}
        />
      )}

      {selectedOrderForVerification && (
        <VerificationModal
          order={selectedOrderForVerification}
          isOpen={!!selectedOrderForVerification}
          onClose={() => setSelectedOrderForVerification(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
