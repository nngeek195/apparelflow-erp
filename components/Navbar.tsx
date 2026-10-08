"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, Role } from './AuthContext';
import {
  Scissors,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
  History,
  LogOut,
  ChevronDown,
  Shirt,
  User,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (pathname === '/login') {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Layers },
    { href: '/orders', label: 'Cutting Orders', icon: Scissors },
    { href: '/verification', label: 'QA Verification', icon: CheckCircle2 },
    { href: '/sewing', label: 'Sewing Handover', icon: Shirt },
    { href: '/recipes', label: 'Recipes', icon: FileSpreadsheet },
    { href: '/audit-logs', label: 'Audit Trail', icon: History },
  ];

  const roleBadgeColors: Record<Role, string> = {
    cutting_supervisor: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
    cutting_verifier: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    sewing_supervisor: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
  };

  const roleEmoji: Record<Role, string> = {
    cutting_supervisor: '✂️',
    cutting_verifier: '🔍',
    sewing_supervisor: '🧵',
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                ApparelFlow <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono font-medium">ERP</span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Manufacturing Quality Ops
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800/80 transition text-left"
              >
                <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">
                  {roleEmoji[user.role] || '👤'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight capitalize">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                    <span
                      className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                        roleBadgeColors[user.role]
                      }`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="pt-1 mt-1">
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
