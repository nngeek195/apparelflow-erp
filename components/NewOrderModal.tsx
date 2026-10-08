"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Scissors, X, Loader2, AlertCircle, Sparkles, Check, Hash } from 'lucide-react';

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

interface NewOrderModalProps {
  recipes: RecipeOption[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewOrderModal({
  recipes,
  isOpen,
  onClose,
  onSuccess,
}: NewOrderModalProps) {
  const { user, getIdToken } = useAuth();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  const [orderNo, setOrderNo] = useState<string>('');
  const [targetQty, setTargetQty] = useState<number | ''>('');
  const [fabricRollId, setFabricRollId] = useState<string>('');
  const [actualFabricYds, setActualFabricYds] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selectedRecipeId when recipes load
  useEffect(() => {
    if (recipes.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(recipes[0].id);
    }
  }, [recipes, selectedRecipeId]);

  // Automatically fetch next ascending, unique order number and roll ID on open
  useEffect(() => {
    if (isOpen) {
      getIdToken().then((token) => {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        fetch('/api/orders/next-number', { headers })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setOrderNo(data.nextOrderNo);
              setFabricRollId(data.nextFabricRollId);
            }
          })
          .catch((err) => console.error('Failed to fetch next order number:', err));
      });
    } else {
      setOrderNo('');
      setFabricRollId('');
      setTargetQty('');
      setActualFabricYds('');
      setErrorMsg(null);
    }
  }, [isOpen, getIdToken]);

  if (!isOpen) return null;

  const effectiveRecipeId = selectedRecipeId || recipes[0]?.id || '';
  const selectedRecipe = recipes.find((r) => r.id === effectiveRecipeId);
  const qtyNumber = typeof targetQty === 'number' ? targetQty : 0;
  const actualYardsNumber = typeof actualFabricYds === 'number' ? actualFabricYds : 0;
  const standardReqYards = selectedRecipe && qtyNumber > 0 ? selectedRecipe.stdFabricYards * qtyNumber : 0;
  const initialWastagePct =
    standardReqYards > 0 && actualYardsNumber > 0
      ? ((actualYardsNumber - standardReqYards) / standardReqYards) * 100
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveRecipeId) {
      setErrorMsg('Please select a valid recipe.');
      return;
    }
    if (!qtyNumber || qtyNumber <= 0) {
      setErrorMsg('Target batch quantity must be greater than 0.');
      return;
    }
    if (!actualYardsNumber || actualYardsNumber <= 0) {
      setErrorMsg('Actual fabric yards cut must be greater than 0.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderNo: orderNo.trim(),
          recipeId: effectiveRecipeId,
          targetQty: qtyNumber,
          fabricRollId: fabricRollId.trim(),
          actualFabricYds: actualYardsNumber,
          status: 'PENDING_VERIFICATION',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create cutting order');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Cutting Order</h2>
              <p className="text-xs text-slate-400">
                Allocate fabric roll, calculate expected piece counts, and initiate batch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {recipes.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No Apparel Recipes Available</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Before creating a cutting order, you must first define at least one style recipe specification in the system.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Recipe Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Apparel Recipe / Style Specification
                </label>
                <select
                  value={effectiveRecipeId}
                  onChange={(e) => {
                    setSelectedRecipeId(e.target.value);
                    const found = recipes.find((r) => r.id === e.target.value);
                    if (found && qtyNumber > 0) {
                      setActualFabricYds(parseFloat((found.stdFabricYards * qtyNumber * 1.02).toFixed(1)));
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.recipeCode} - {r.name} ({r.category}) • {r.stdFabricYards} yds/pc
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-indigo-400" />
                      Order Number
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      Auto-Ascending
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Target Batch Quantity (Garments)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 100"
                    value={targetQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const parsed = isNaN(val) ? '' : val;
                      setTargetQty(parsed);
                      if (selectedRecipe && typeof parsed === 'number' && parsed > 0) {
                        setActualFabricYds(parseFloat((selectedRecipe.stdFabricYards * parsed * 1.02).toFixed(1)));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      Fabric Roll / Lot ID
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      Auto-Ascending
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={fabricRollId}
                    onChange={(e) => setFabricRollId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Actual Fabric Yards Cut
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 150.0"
                    value={actualFabricYds}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setActualFabricYds(isNaN(val) ? '' : val);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculated Preview Panel */}
              {selectedRecipe && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Standard Yardage Required:</span>
                    <span className="font-mono font-bold text-white">
                      {standardReqYards.toFixed(1)} yards
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Estimated Wastage:</span>
                    <span
                      className={`font-mono font-bold ${
                        initialWastagePct > selectedRecipe.wastageCap
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {initialWastagePct.toFixed(2)}% (Cap: {selectedRecipe.wastageCap}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Component breakdown info */}
              {selectedRecipe && selectedRecipe.components.length > 0 && (
                <div className="text-xs text-slate-400 space-y-1.5">
                  <span className="font-semibold text-slate-300 block">
                    Components to be Cut & Verified ({selectedRecipe.components.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecipe.components.map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]"
                      >
                        {c.componentName} ({c.piecesPerGarment * qtyNumber} pcs)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                Initiate Cutting Batch
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
