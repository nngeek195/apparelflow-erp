"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import VerificationModal from '@/components/VerificationModal';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Check,
  AlertCircle,
  ArrowRight,
  Scale,
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

export default function VerificationPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const isVerifier = user?.role === 'cutting_verifier';

  const pendingOrders = orders.filter((o) => o.status === 'PENDING_VERIFICATION');
  const completedOrders = orders.filter((o) => o.status === 'VERIFIED' || o.status === 'REJECTED');

  const currentDisplayOrders = activeTab === 'PENDING' ? pendingOrders : completedOrders;

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Quality Verification Workbench
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
              {pendingOrders.length} Pending Audit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conduct piece-level inspections, evaluate fabric wastage against style cap, and issue compliance sign-offs.
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
        </div>
      </div>

      {/* Verifier Role Notice Banner */}
      {!isVerifier && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/50 flex items-center gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-semibold text-amber-200">
              Read-only mode ({user ? `${user.fullName} • ${user.role.replace('_', ' ')}` : 'User'}).
            </p>
            <p className="text-amber-400/80 mt-0.5">
              Signing off on quality audits or issuing rejections requires the <strong>cutting_verifier</strong> RBAC permission.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending Quality Audits ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'COMPLETED'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed Audits & Sign-offs ({completedOrders.length})
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            Loading verification queue...
          </div>
        ) : currentDisplayOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            {activeTab === 'PENDING'
              ? 'No batches currently pending verification. All batches are verified!'
              : 'No completed audits recorded yet.'}
          </div>
        ) : (
          currentDisplayOrders.map((order) => {
            const standardFabric = order.recipe.stdFabricYards * order.targetQty;
            const varianceYds = order.actualFabricYds - standardFabric;
            const wastagePct = standardFabric > 0 ? (varianceYds / standardFabric) * 100 : 0;
            const capExceeded = wastagePct > order.recipe.wastageCap;

            const hasDeficit = order.items.some((i) => i.status === 'RED');
            const hasYellow = order.items.some((i) => i.status === 'YELLOW');

            return (
              <div
                key={order.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col shadow-lg"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-white text-base">{order.orderNo}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      {order.recipe.name}
                    </div>
                  </div>
                  <div>
                    {order.status === 'PENDING_VERIFICATION' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Audit Req.
                      </span>
                    ) : order.status === 'VERIFIED' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> PASSED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> REJECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body Metrics */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Batch Target
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {order.targetQty} pcs
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Fabric Roll
                      </span>
                      <span className="font-mono font-bold text-indigo-300 text-sm">
                        {order.fabricRollId}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Cut Fabric
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {order.actualFabricYds} yds
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border ${
                        capExceeded ? 'bg-rose-950/40 border-rose-900/60' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Wastage / Cap
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          capExceeded ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {wastagePct.toFixed(1)}% / {order.recipe.wastageCap}%
                      </span>
                    </div>
                  </div>

                  {/* Component Checklist Preview */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                      <span>Cut Component Inspection</span>
                      <span>
                        {order.items.filter((i) => i.status === 'GREEN').length}/{order.items.length} Exact
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-300 truncate max-w-[150px]">
                            {item.component.componentName}
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-400">
                              {item.actualQty} / {item.expectedQty}
                            </span>
                            <span
                              className={`h-2 w-2 rounded-full ${
                                item.status === 'GREEN'
                                  ? 'bg-emerald-400'
                                  : item.status === 'YELLOW'
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-[10px] text-slate-500 text-center">
                          +{order.items.length - 3} more sub-components
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection Note or Audit Signature */}
                  {order.verificationLog && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="text-slate-400">
                        Signed off by <strong className="text-white">{order.verificationLog.verifier.fullName}</strong>
                      </div>
                      {order.verificationLog.rejectionNote && (
                        <div className="text-rose-300 text-[11px] bg-rose-950/40 p-2 rounded-lg border border-rose-900/60 mt-1">
                          &quot;{order.verificationLog.rejectionNote}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/40">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      order.status === 'PENDING_VERIFICATION'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {order.status === 'PENDING_VERIFICATION'
                      ? 'Launch Verification Workbench'
                      : 'View Audit Sign-off Record'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Verification Modal */}
      {selectedOrder && (
        <VerificationModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
