"use client";

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Scissors, X, Loader2, AlertCircle, Sparkles, Check } from 'lucide-react';

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
  const { user } = useAuth();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  const [orderNo, setOrderNo] = useState<string>(`CO-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [targetQty, setTargetQty] = useState<number>(100);
  const [fabricRollId, setFabricRollId] = useState<string>(`ROLL-${Math.floor(1000 + Math.random() * 9000)}`);
  const [actualFabricYds, setActualFabricYds] = useState<number>(150);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0];
  const standardReqYards = selectedRecipe ? selectedRecipe.stdFabricYards * targetQty : 0;
  const initialWastagePct = standardReqYards > 0 ? ((actualFabricYds - standardReqYards) / standardReqYards) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo,
          recipeId: selectedRecipeId,
          targetQty,
          fabricRollId,
          actualFabricYds,
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
                value={selectedRecipeId}
                onChange={(e) => {
                  setSelectedRecipeId(e.target.value);
                  const found = recipes.find((r) => r.id === e.target.value);
                  if (found) {
                    setActualFabricYds(parseFloat((found.stdFabricYards * targetQty * 1.02).toFixed(1)));
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
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Order Number
                </label>
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
                  value={targetQty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setTargetQty(val);
                    if (selectedRecipe) {
                      setActualFabricYds(parseFloat((selectedRecipe.stdFabricYards * val * 1.02).toFixed(1)));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Fabric Roll Barcode / Lot ID
                </label>
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
                  value={actualFabricYds}
                  onChange={(e) => setActualFabricYds(parseFloat(e.target.value) || 0)}
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
                      initialWastagePct > selectedRecipe.wastageCap ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {initialWastagePct.toFixed(2)}% (Cap: {selectedRecipe.wastageCap}%)
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Auto-Generated Component Pieces to Cut:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedRecipe.components.map((c) => (
                      <div
                        key={c.id}
                        className="px-2.5 py-1.5 bg-slate-900 rounded-lg flex items-center justify-between text-slate-300"
                      >
                        <span className="truncate">{c.componentName}</span>
                        <span className="font-mono font-bold text-indigo-400 ml-2">
                          {c.piecesPerGarment * targetQty} pcs
                        </span>
                      </div>
                    ))}
                  </div>
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              Dispatch to Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
