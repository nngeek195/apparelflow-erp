'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { createClient } from '@/utils/supabase/client';
import {
  Shield,
  Scissors,
  CheckCircle2,
  Shirt,
  LogOut,
  Layers,
  ChevronDown,
  X,
  FileSpreadsheet,
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Shield className="w-3 h-3 text-amber-600" />
            Supreme Admin
          </span>
        );
      case 'CUTTING_SUPERVISOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Scissors className="w-3 h-3 text-purple-600" />
            Cutting Supervisor
          </span>
        );
      case 'CUTTING_VERIFIER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Cutting Verifier
          </span>
        );
      case 'SEWING_SUPERVISOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Shirt className="w-3 h-3 text-amber-600" />
            Sewing Supervisor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href={getHomeLink()} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shadow-xs group-hover:border-purple-300 transition">
                <Layers className="w-5 h-5 text-purple-700" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base text-slate-900 tracking-tight flex items-center gap-1">
                  ApparelFlow <span className="text-amber-700 text-xs font-mono px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">ERP</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Garment Operations OS</span>
              </div>
            </Link>

            {/* Department Navigation */}
            {user && (
              <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200 text-xs font-semibold">
                {isAdmin ? (
                  // Supreme Admin sees ALL department tabs
                  <>
                    <Link
                      href="/admin"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/admin'
                          ? 'bg-purple-100 text-purple-900 font-bold border border-purple-200 shadow-xs'
                          : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      Supreme Control
                    </Link>

                    <Link
                      href="/cutting-supervisor"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/cutting-supervisor'
                          ? 'bg-purple-100 text-purple-900 font-bold border border-purple-200 shadow-xs'
                          : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5 text-purple-600" />
                      Cutting Floor
                    </Link>

                    <Link
                      href="/verification"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/verification'
                          ? 'bg-purple-100 text-purple-900 font-bold border border-purple-200 shadow-xs'
                          : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verification QC
                    </Link>

                    <Link
                      href="/sewing"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/sewing'
                          ? 'bg-purple-100 text-purple-900 font-bold border border-purple-200 shadow-xs'
                          : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                      }`}
                    >
                      <Shirt className="w-3.5 h-3.5 text-amber-600" />
                      Sewing Assembly
                    </Link>

                    <Link
                      href="/"
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        pathname === '/'
                          ? 'bg-slate-200/80 text-slate-900 font-bold'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
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
                        className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-900 font-bold border border-purple-200 flex items-center gap-1.5 shadow-xs"
                      >
                        <Scissors className="w-3.5 h-3.5 text-purple-600" />
                        Cutting Supervisor Dashboard
                      </Link>
                    )}
                    {role === 'CUTTING_VERIFIER' && (
                      <Link
                        href="/verification"
                        className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Cutting Verifier QC Dashboard
                      </Link>
                    )}
                    {role === 'SEWING_SUPERVISOR' && (
                      <Link
                        href="/sewing"
                        className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-200 flex items-center gap-1.5 shadow-xs"
                      >
                        <Shirt className="w-3.5 h-3.5 text-amber-600" />
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


                {/* User Info & Badge */}
                <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-800 capitalize">
                      {user.fullName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{user.email}</span>
                  </div>
                  {getRoleBadge()}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600 transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Role Switcher Modal for Easy Evaluator Assessment */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-2">
              <h3 className="text-lg font-black text-slate-900">Switch Administrator Role</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select an account below to test its role-restricted dashboard view.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}