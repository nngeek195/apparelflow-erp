"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import {
  Shirt,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Check,
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

export default function SewingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?status=VERIFIED');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load verified batches for sewing:', err);
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

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Shirt className="w-6 h-6 text-purple-400" />
              Sewing Assembly Line Handover
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
              {orders.length} Batches Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Intake batches that successfully passed QA cutting inspection into sewing floor lines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sewing Flow Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Downstream Production Integration
          </div>
          <p className="text-sm font-semibold text-white">
            Only Verified Batches are unlocked for sewing line assignment.
          </p>
          <p className="text-xs text-slate-400">
            Guarantees that 100% of cut panels have verified piece counts and adhere to strict wastage tolerance caps.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-300 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-slate-500 font-semibold uppercase text-[10px]">Verified Garments</div>
            <div className="text-lg font-bold text-purple-300 font-mono">
              {orders.reduce((sum, o) => sum + o.targetQty, 0)} pcs
            </div>
          </div>
          <div>
            <div className="text-slate-500 font-semibold uppercase text-[10px]">Approved Yardage</div>
            <div className="text-lg font-bold text-slate-200 font-mono">
              {orders.reduce((sum, o) => sum + o.actualFabricYds, 0).toFixed(1)} yds
            </div>
          </div>
        </div>
      </div>

      {/* Verified Batches Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            Loading verified batches...
          </div>
        ) : orders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            No verified batches currently waiting for sewing intake.
          </div>
        ) : (
          orders.map((order) => {
            const totalPieces = order.items.reduce((acc, i) => acc + i.actualQty, 0);

            return (
              <div
                key={order.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col shadow-lg"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-white text-base">{order.orderNo}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      {order.recipe.name}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> QA Cleared
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Target Units
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {order.targetQty} garments
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Total Cut Panels
                      </span>
                      <span className="font-mono font-bold text-purple-300 text-sm">
                        {totalPieces} pieces
                      </span>
                    </div>
                  </div>

                  {/* Verifier Audit Stamp */}
                  {order.verificationLog && (
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> QA Approved
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {order.verificationLog.wastagePct}% Wastage
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px]">
                        Certified by Verifier{' '}
                        <strong className="text-white">{order.verificationLog.verifier.fullName}</strong>
                      </div>
                    </div>
                  )}

                  {/* Components Breakdown */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Panel Component Bundles:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {order.items.map((i) => (
                        <div
                          key={i.id}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-300 truncate">{i.component.componentName}</span>
                          <span className="font-mono font-bold text-purple-400 ml-1">
                            {i.actualQty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Handover Status */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Assembly Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    QA Cleared • Ready for Line Assembly
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
