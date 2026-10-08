"use client";

import React, { useState } from 'react';
import { FileSpreadsheet, X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface ComponentInput {
  componentName: string;
  piecesPerGarment: number;
}

interface NewRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewRecipeModal({ isOpen, onClose, onSuccess }: NewRecipeModalProps) {
  const [recipeCode, setRecipeCode] = useState(`RCP-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Denim');
  const [stdFabricYards, setStdFabricYards] = useState(1.25);
  const [wastageCap, setWastageCap] = useState(3.5);
  const [components, setComponents] = useState<ComponentInput[]>([
    { componentName: 'Front Body', piecesPerGarment: 1 },
    { componentName: 'Back Body', piecesPerGarment: 1 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const addComponent = () => {
    setComponents((prev) => [...prev, { componentName: '', piecesPerGarment: 1 }]);
  };

  const removeComponent = (index: number) => {
    if (components.length <= 1) return;
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: keyof ComponentInput, value: any) => {
    setComponents((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const validComponents = components.filter((c) => c.componentName.trim().length > 0);
    if (validComponents.length === 0) {
      setErrorMsg('Please specify at least one valid recipe component.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeCode,
          name,
          category,
          stdFabricYards,
          wastageCap,
          components: validComponents,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create recipe');
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Apparel Style Recipe</h2>
              <p className="text-xs text-slate-400">
                Define garment specifications, standard fabric yield, and required cut pieces
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Recipe Code</label>
                <input
                  type="text"
                  required
                  value={recipeCode}
                  onChange={(e) => setRecipeCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Garment Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Denim">Denim</option>
                  <option value="Knitwear">Knitwear</option>
                  <option value="Woven">Woven</option>
                  <option value="Bottoms">Bottoms</option>
                  <option value="Outerwear">Outerwear</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Style / Garment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vintage Wash Denim Jacket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Std Fabric Yards / Pc</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={stdFabricYards}
                  onChange={(e) => setStdFabricYards(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Max Permitted Wastage Cap (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={wastageCap}
                  onChange={(e) => setWastageCap(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Recipe Cut Components Checklist
                </label>
                <button
                  type="button"
                  onClick={addComponent}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Component
                </button>
              </div>

              <div className="space-y-2">
                {components.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                    <input
                      type="text"
                      required
                      placeholder="Component Name (e.g. Collar, Sleeve)"
                      value={c.componentName}
                      onChange={(e) => updateComponent(idx, 'componentName', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Pcs:</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={c.piecesPerGarment}
                        onChange={(e) =>
                          updateComponent(idx, 'piecesPerGarment', parseInt(e.target.value, 10) || 1)
                        }
                        className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    {components.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeComponent(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 border border-purple-500 transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Recipe Spec
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
