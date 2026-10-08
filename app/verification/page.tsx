'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import VerificationModal from '@/components/VerificationModal';
import { CheckCircle2, Clock, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export default function VerificationQueue() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setDataLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const appUser = user as any;

  useEffect(() => {
    if (!authLoading && !appUser) {
      router.push('/login');
    }
  }, [appUser, authLoading, router]);

  const fetchQueue = useCallback(async () => {
    try {
      setDataLoading(true);
      // Fetch all orders and filter for PENDING_VERIFICATION
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const pendingOrders = (data.orders || []).filter(
          (o: any) => o.status === 'PENDING_VERIFICATION'
        );
        setOrders(pendingOrders);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appUser) fetchQueue();
  }, [appUser, fetchQueue]);

  if (authLoading || (!appUser && loading)) {
    return (
      <div className="flex-1 w-full min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>QC & Verification Checkpoint</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Pending Batch Audits</h1>
          <p className="text-sm text-slate-400 mt-1">
            Physical component counts and status verification for cut batches.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sm font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {orders.length === 0 && !loading ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">All Caught Up</h3>
          <p className="text-sm text-slate-500 mt-1">No pending batches require verification.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{order.orderNo}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                    PENDING
                  </span>
                </div>
                
                <div className="mb-5 space-y-1">
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Style:</span> {order.recipe.name}</p>
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Roll ID:</span> {order.fabricRollId}</p>
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Target:</span> {order.targetQty} pcs</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(order)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Audit & Verify Batch
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <VerificationModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={fetchQueue}
        />
      )}
    </div>
  );
}