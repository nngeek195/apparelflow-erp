"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import NewRecipeModal from '@/components/NewRecipeModal';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Scissors,
  Layers,
  Sparkles,
  Tag,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

interface RecipeComponent {
  id: string;
  componentName: string;
  piecesPerGarment: number;
}

interface Recipe {
  id: string;
  recipeCode: string;
  name: string;
  category: string;
  stdFabricYards: number;
  wastageCap: number;
  components: RecipeComponent[];
  _count?: {
    cuttingOrders: number;
  };
}

export default function RecipesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);

  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch('/api/recipes');
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes || []);
      }
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  const isSupervisor = user?.role === 'cutting_supervisor';

  const categories = ['ALL', ...Array.from(new Set(recipes.map((r) => r.category)))];

  const filteredRecipes = recipes.filter((r) => {
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.recipeCode.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-purple-400" />
              Apparel Recipes & Style Specifications
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
              {recipes.length} styles
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure standard fabric consumption yields, maximum wastage caps, and piece breakdown checklists.
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

          {isSupervisor && (
            <button
              onClick={() => setRecipeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition"
            >
              <Plus className="w-4 h-4" /> Define New Recipe
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search recipes by style name or recipe code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            Loading recipes...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            No recipes found matching your search.
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const totalPiecesPerGarment = recipe.components.reduce(
              (acc, c) => acc + c.piecesPerGarment,
              0
            );

            return (
              <div
                key={recipe.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col shadow-lg"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {recipe.recipeCode}
                    </span>
                    <h2 className="text-base font-bold text-white mt-1.5">{recipe.name}</h2>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-800 text-slate-300">
                    {recipe.category}
                  </span>
                </div>

                {/* Body Metrics */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Std Consumption
                      </span>
                      <span className="font-mono font-bold text-white text-base">
                        {recipe.stdFabricYards}{' '}
                        <span className="text-xs text-slate-400 font-normal">yds/pc</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Max Wastage Cap
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-base">
                        {recipe.wastageCap}%
                      </span>
                    </div>
                  </div>

                  {/* Components List */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                      <span>Cut Component Breakdown</span>
                      <span className="text-[11px] text-purple-300 font-mono">
                        {totalPiecesPerGarment} pcs total
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {recipe.components.map((c) => (
                        <div
                          key={c.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-300">{c.componentName}</span>
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {c.piecesPerGarment} {c.piecesPerGarment === 1 ? 'piece' : 'pieces'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Orders placed:{' '}
                    <strong className="text-white font-mono">
                      {recipe._count?.cuttingOrders ?? 0}
                    </strong>
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> QA Ready
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Recipe Modal */}
      {recipeModalOpen && (
        <NewRecipeModal
          isOpen={recipeModalOpen}
          onClose={() => setRecipeModalOpen(false)}
          onSuccess={fetchRecipes}
        />
      )}
    </div>
  );
}
