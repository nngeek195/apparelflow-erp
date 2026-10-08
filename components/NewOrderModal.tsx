'use client';

import { useState } from 'react';
import { X, Scissors } from 'lucide-react';

interface RecipeOption {
  id: string;
  recipeCode: string;
  name: string;
  stdFabricYards: number;
}

export interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes?: RecipeOption[];
  onSuccess?: () => void | Promise<void>;
}

export default function NewOrderModal({ isOpen, onClose, recipes = [], onSuccess }: NewOrderModalProps) {
  const [recipeId, setRecipeId] = useState('');
  const [targetQty, setTargetQty] = useState<number | ''>('');
  const [fabricRollId, setFabricRollId] = useState('');
  const [actualFabricYds, setActualFabricYds] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recipeId || !targetQty || !fabricRollId || !actualFabricYds) {
      setError('All fields are required.');
      return;
    }

    if (Number(targetQty) <= 0 || Number(actualFabricYds) <= 0) {
      setError('Quantities and yards must be greater than zero.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          targetQty: Number(targetQty),
          fabricRollId,
          actualFabricYds: Number(actualFabricYds),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      if (onSuccess) await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-blue-400" />
            Create Cutting Order
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Style Recipe</label>
            <select
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              required
            >
              <option value="">Select a recipe...</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.recipeCode} - {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Target Qty (Garments)</label>
              <input
                type="number"
                min="1"
                value={targetQty}
                onChange={(e) => setTargetQty(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Fabric Roll ID</label>
              <input
                type="text"
                placeholder="e.g. FAB-001"
                value={fabricRollId}
                onChange={(e) => setFabricRollId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Actual Fabric Used (Yards)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={actualFabricYds}
              onChange={(e) => setActualFabricYds(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? 'Processing...' : 'Submit Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}