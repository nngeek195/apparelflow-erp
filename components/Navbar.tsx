'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { createClient } from '@/utils/supabase/client';
import RoleSwitcher from '@/components/RoleSwitcher';
import {
  Shield,
  Scissors,
  CheckCircle2,
  Shirt,
  LogOut,
  User,
  Layers,
  ChevronDown,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [showRoleModal, setShowRoleModal] = useState(false);

  // If on /login page, don't show the navbar
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const rawRole = user?.role || '';
  const role = rawRole.toUpperCase();
  const isAdmin = role === 'ADMIN';

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Shield className="w-3 h-3 text-amber-400" />
            Supreme Admin
          </span>
        );
      case 'CUTTING_SUPERVISOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-900/40 text-purple-300 border border-purple-700/60">
            <Scissors className="w-3 h-3 text-purple-400" />
            Cutting Supervisor
          </span>
        );
      case 'CUTTING_VERIFIER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Cutting Verifier
          </span>
        );
      case 'SEWING_SUPERVISOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-700/60">
            <Shirt className="w-3 h-3 text-amber-400" />
            Sewing Supervisor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            Staff Member
          </span>
        );
    }
  };

  const getHomeLink = () => {
    if (isAdmin) return '/admin';
    if (role === 'CUTTING_SUPERVISOR') return '/cutting-supervisor';
    if (role === 'CUTTING_VERIFIER') return '/verification';
    if (role === 'SEWING_SUPERVISOR') return '/sewing';
    return '/dashboard';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#120a1f]/95 backdrop-blur-md border-b border-[#2e1c47] text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href={getHomeLink()} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/30 border border-amber-500/40 flex items-center justify-center shadow-inner group-hover:border-amber-400 transition">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base text-white tracking-tight flex items-center gap-1">
                  ApparelFlow <span className="text-amber-400 text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">ERP</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Garment Operations OS</span>
              </div>
            </Link>

            {/* Department Navigation */}
            {user && (
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-purple-900/40 text-xs font-semibold">
                {isAdmin ? (
                  // Supreme Admin sees ALL department tabs
                  <>
                    <Link
                      href="/admin"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/admin'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-purple-950/40'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Supreme Control
                    </Link>

                    <Link
                      href="/cutting-supervisor"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/cutting-supervisor'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-purple-950/40'
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5 text-purple-400" />
                      Cutting Floor
                    </Link>

                    <Link
                      href="/verification"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/verification'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-purple-950/40'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Verification QC
                    </Link>

                    <Link
                      href="/sewing"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/sewing'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-purple-950/40'
                      }`}
                    >
                      <Shirt className="w-3.5 h-3.5 text-amber-400" />
                      Sewing Assembly
                    </Link>

                    <Link
                      href="/"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/'
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-slate-400 hover:text-white hover:bg-purple-950/40'
                      }`}
                    >
                      Overview Hub
                    </Link>
                  </>
                ) : (
                  // Scoped Users only see their assigned workbench
                  <>
                    {role === 'CUTTING_SUPERVISOR' && (
                      <Link
                        href="/cutting-supervisor"
                        className="px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5"
                      >
                        <Scissors className="w-3.5 h-3.5 text-purple-400" />
                        Cutting Supervisor Dashboard
                      </Link>
                    )}
                    {role === 'CUTTING_VERIFIER' && (
                      <Link
                        href="/verification"
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Cutting Verifier QC Dashboard
                      </Link>
                    )}
                    {role === 'SEWING_SUPERVISOR' && (
                      <Link
                        href="/sewing"
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5"
                      >
                        <Shirt className="w-3.5 h-3.5 text-amber-400" />
                        Sewing Supervisor Dashboard
                      </Link>
                    )}
                  </>
                )}
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Role Switcher Drawer Button for Evaluator */}
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#1f1335] hover:bg-[#2b1b47] border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  title="Switch between assessment roles"
                >
                  <span className="hidden sm:inline">Role Switcher</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* User Info & Badge */}
                <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-purple-900/40">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-white capitalize">
                      {user.fullName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
                  </div>
                  {getRoleBadge()}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-[#1b122c] hover:bg-rose-950/40 border border-purple-900/40 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-xs shadow-md transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Role Switcher Modal for Easy Evaluator Assessment */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#160d24] border border-[#372458] rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-purple-950/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-2">
              <h3 className="text-lg font-black text-white">Switch Administrator Role</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select an account below to test its role-restricted dashboard view.
              </p>
            </div>
            <RoleSwitcher />
          </div>
        </div>
      )}
    </>
  );
}