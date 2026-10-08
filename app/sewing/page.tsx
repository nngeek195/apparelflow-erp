'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Shirt, CheckCircle2, Clock, AlertTriangle, ArrowLeft, RefreshCw, Scissors } from 'lucide-react';

export default function SewingQueue() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AppUser casting
  const appUser = user as any;

  useEffect(() => {
    if (!authLoading && !appUser) {
      router.push('/login');
    }
  }, [appUser, authLoading, router]);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sewing/queue');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load sewing queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appUser) fetchQueue();
  }, [appUser, fetchQueue]);

  if (authLoading || (!appUser && loading)) {
    return (
      <div className="flex-1 w-full min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
              <Shirt className="w-3.5 h-3.5 text-purple-400" />
              <span>Assembly Line Handoff</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Sewing Production Queue</h1>
          <p className="text-sm text-slate-400 mt-1">
            Verified cutting batches cleared for sewing assembly.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sm font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Queue Grid */}
      {orders.length === 0 && !loading ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Queue Empty</h3>
          <p className="text-sm text-slate-500 mt-1">No verified batches are waiting for assembly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{order.orderNo}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{order.recipe.name} ({order.recipe.recipeCode})</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400 font-mono">{order.targetQty}</div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Garments</div>
                  </div>
                </div>

                {/* Immutable Audit Trail */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800/60">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-500 uppercase">Verified By</span>
                    <span className="block text-sm font-medium text-slate-300 mt-1">
                      {order.verificationLog?.verifierName || 'System'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-500 uppercase">Timestamp</span>
                    <span className="block text-sm font-medium text-slate-300 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(order.verificationLog?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="col-span-2 pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5" /> Fabric Wastage
                    </span>
                    <span className={`text-sm font-bold font-mono ${order.verificationLog?.wastagePct > order.recipe.wastageCap ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {order.verificationLog?.wastagePct}% 
                      {order.verificationLog?.wastagePct > order.recipe.wastageCap && (
                        <AlertTriangle className="w-3.5 h-3.5 inline ml-1.5 mb-0.5" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Component Breakdown */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Component Manifest</h4>
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/50 last:border-0">
                      <span className="text-slate-300">{item.component.componentName}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-500 text-xs">Req: {item.expectedQty}</span>
                        <span className="text-emerald-400 font-semibold">{item.actualQty} pcs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2">
                <Shirt className="w-4 h-4" />
                Start Sewing Assembly
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}