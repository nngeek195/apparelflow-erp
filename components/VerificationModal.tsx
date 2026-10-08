'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any;
  onSuccess?: () => void | Promise<void>;
}

export default function VerificationModal({ isOpen, onClose, order, onSuccess }: VerificationModalProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [rejectionNote, setRejectionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize counts from order expected quantities
  useEffect(() => {
    if (order?.items) {
      const initial: Record<string, number> = {};
      order.items.forEach((item: any) => {
        initial[item.id] = item.expectedQty;
      });
      setCounts(initial);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleCountChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    setCounts(prev => ({ ...prev, [id]: isNaN(num) || num < 0 ? 0 : num }));
  };

  // Traffic Light Logic
  const getItemStatus = (id: string, expected: number) => {
    const actual = counts[id] ?? expected;
    if (actual < expected) return 'RED';
    if (actual > expected) return 'YELLOW';
    return 'GREEN';
  };

  const hasRedItems = order.items.some((item: any) => 
    getItemStatus(item.id, item.expectedQty) === 'RED'
  );

  const handleSubmit = async (decision: 'APPROVED' | 'REJECTED') => {
    setError('');
    
    if (decision === 'REJECTED' && !rejectionNote.trim()) {
      setError('A rejection reason is mandatory when rejecting a batch.');
      return;
    }

    setLoading(true);

    try {
      const payloadItems = order.items.map((item: any) => ({
        id: item.id,
        actualQty: counts[item.id] ?? item.expectedQty,
      }));

      const res = await fetch(`/api/orders/${order.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionNote: decision === 'REJECTED' ? rejectionNote : null,
          items: payloadItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (onSuccess) await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-white">QC Verification Terminal</h2>
            <p className="text-sm text-slate-400 font-mono mt-1">Batch: {order.orderNo}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-rose-400 text-sm font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Component Physical Count</h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Component</th>
                    <th className="px-4 py-3 font-semibold text-right">Expected</th>
                    <th className="px-4 py-3 font-semibold text-center">Actual Count</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {order.items.map((item: any) => {
                    const status = getItemStatus(item.id, item.expectedQty);
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-4 font-medium text-slate-200">{item.component.componentName}</td>
                        <td className="px-4 py-4 text-right font-mono text-slate-400">{item.expectedQty}</td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            value={counts[item.id] ?? item.expectedQty}
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            className="w-24 mx-auto block px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                          />
                        </td>
                        <td className="px-4 py-4 text-center">
                          {status === 'GREEN' && <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />}
                          {status === 'YELLOW' && <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />}
                          {status === 'RED' && <XCircle className="w-5 h-5 text-rose-500 mx-auto" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Rejection Note (Mandatory if Rejecting)</label>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Detail the defect or shortage..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => handleSubmit('REJECTED')}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-600/30 text-sm font-bold transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Reject & Return Batch'}
          </button>
          
          <button
            onClick={() => handleSubmit('APPROVED')}
            disabled={loading || hasRedItems}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg ${
              hasRedItems 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
            title={hasRedItems ? 'Cannot approve: Clear shortages first' : 'Approve batch for sewing'}
          >
            {hasRedItems && <ShieldAlert className="w-4 h-4" />}
            {loading ? 'Processing...' : 'Sign-Off & Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}