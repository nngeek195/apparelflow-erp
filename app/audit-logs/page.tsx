"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  AlertTriangle,
  User,
  Calendar,
} from 'lucide-react';

interface AuditLog {
  id: string;
  orderId: string;
  verifierId: string;
  decision: 'APPROVED' | 'REJECTED';
  rejectionNote?: string | null;
  wastagePct: number;
  timestamp: string;
  verifier: {
    fullName: string;
    email: string;
    role: string;
  };
  order: {
    orderNo: string;
    targetQty: number;
    fabricRollId: string;
    actualFabricYds: number;
    recipe: {
      name: string;
      recipeCode: string;
      wastageCap: number;
    };
    creator: {
      fullName: string;
    };
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDecision, setFilterDecision] = useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesDecision = filterDecision === 'ALL' || log.decision === filterDecision;
    const matchesSearch =
      log.order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      log.order.recipe.name.toLowerCase().includes(search.toLowerCase()) ||
      log.verifier.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (log.rejectionNote && log.rejectionNote.toLowerCase().includes(search.toLowerCase()));
    return matchesDecision && matchesSearch;
  });

  const totalAudits = logs.length;
  const approvedCount = logs.filter((l) => l.decision === 'APPROVED').length;
  const approvalRate = totalAudits > 0 ? (approvedCount / totalAudits) * 100 : 0;
  const avgWastage =
    totalAudits > 0 ? logs.reduce((acc, l) => acc + l.wastagePct, 0) / totalAudits : 0;

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <History className="w-6 h-6 text-indigo-400" />
              Quality Compliance Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
              {logs.length} logged sign-offs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable audit records of verifier inspections, fabric wastage calculations, and quality decisions.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Audits Executed
          </span>
          <span className="text-2xl font-mono font-bold text-white mt-1 block">
            {totalAudits}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Recorded in Cloud SQL</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Compliance Pass Rate
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400 mt-1 block">
            {approvalRate.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {approvedCount} of {totalAudits} batches approved
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Average Batch Wastage
          </span>
          <span className="text-2xl font-mono font-bold text-indigo-300 mt-1 block">
            {avgWastage.toFixed(2)}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across all audited batches</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail by Order #, Style, Verifier, or Rejection remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'APPROVED', 'REJECTED'] as const).map((dec) => (
            <button
              key={dec}
              onClick={() => setFilterDecision(dec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                filterDecision === dec
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {dec === 'ALL' ? 'All Decisions' : dec}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Order No</th>
                <th className="px-5 py-3.5">Style Recipe</th>
                <th className="px-5 py-3.5">Verifier Sign-off</th>
                <th className="px-5 py-3.5 text-center">Wastage %</th>
                <th className="px-5 py-3.5 text-center">Decision</th>
                <th className="px-5 py-3.5">Audit Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Loading compliance records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isApproved = log.decision === 'APPROVED';
                  const capExceeded = log.wastagePct > log.order.recipe.wastageCap;

                  return (
                    <tr key={log.id} className="hover:bg-slate-850/40 transition">
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-white text-xs">
                          {log.order.orderNo}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          Roll: {log.order.fabricRollId}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">{log.order.recipe.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Target: {log.order.targetQty} units
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-slate-200 font-semibold">{log.verifier.fullName}</div>
                        <div className="text-[10px] text-slate-500">{log.verifier.email}</div>
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap font-mono">
                        <span
                          className={`font-bold ${
                            capExceeded ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {log.wastagePct.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Cap: {log.order.recipe.wastageCap}%
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isApproved
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {log.decision}
                        </span>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        {log.rejectionNote ? (
                          <div className="text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-900/60 text-[11px] leading-relaxed">
                            {log.rejectionNote}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">
                            Conforms with recipe specification & piece counts.
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
