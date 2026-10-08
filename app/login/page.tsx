"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuth, Role } from '@/components/AuthContext';
import {
  Scissors,
  CheckCircle2,
  Shirt,
  Database,
  ShieldCheck,
  Sparkles,
  LogIn,
  Loader2,
  ArrowRight,
  Server,
  Lock,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { switchRole } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async (role: Role = 'cutting_supervisor') => {
    setLoadingGoogle(true);
    setErrorMsg(null);
    try {
      // 1. Open Google Sign-In Popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // 2. Retrieve Firebase ID Token
      const idToken = await result.user.getIdToken();

      // 3. Register/Sync Admin user with Cloud SQL PostgreSQL backend
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, requestedRole: role }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to synchronize user in database');
      }
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      setErrorMsg(error.message || 'Google Authentication failed');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoLogin = async (role: Role) => {
    setLoadingRole(role);
    try {
      await switchRole(role);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch demo persona');
    } finally {
      setLoadingRole(null);
    }
  };

  const demoPersonas = [
    {
      role: 'cutting_supervisor' as Role,
      title: 'Cutting Supervisor',
      name: 'Marcus Vance',
      description: 'Creates orders, tracks fabric roll allocation & dispatches batches',
      avatar: '✂️',
      color: 'from-blue-600 to-indigo-700',
    },
    {
      role: 'cutting_verifier' as Role,
      title: 'Cutting Verifier',
      name: 'Elena Rostova',
      description: 'Performs physical piece audits, logs wastage %, issues approvals',
      avatar: '🔍',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      role: 'sewing_supervisor' as Role,
      title: 'Sewing Supervisor',
      name: 'Kenji Sato',
      description: 'Receives verified batches and allocates into sewing assembly lines',
      avatar: '🧵',
      color: 'from-purple-600 to-fuchsia-700',
    },
  ];

  return (
    <div className="flex-1 min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto space-y-8 relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center text-white shadow-xl shadow-indigo-500/25">
            <Scissors className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              ApparelFlow <span className="text-indigo-400 font-mono font-medium">ERP</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Cloud-Native Apparel Manufacturing Operations
            </p>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Full-stack ERP system with Google Cloud SQL PostgreSQL, Firebase Authentication, and RBAC workflows.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Primary OAuth Sign-In Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
          <div>
            <button
              onClick={() => handleGoogleLogin('cutting_supervisor')}
              disabled={loadingGoogle}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 transition"
            >
              {loadingGoogle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>Sign in with Google OAuth</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              Authenticates with Firebase & synchronizes profile in Cloud SQL
            </p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Or Instant Demo Mode (1-Click)
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* 1-Click Demo Evaluation Personas */}
          <div className="space-y-2.5">
            {demoPersonas.map((p) => {
              const isSelected = loadingRole === p.role;
              return (
                <button
                  key={p.role}
                  onClick={() => handleDemoLogin(p.role)}
                  disabled={!!loadingRole}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{p.avatar}</div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cloud Architecture Footnote */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-500 space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Google Cloud Platform (us-east4)</span>
          </div>
          <div>PostgreSQL Cloud SQL • Firebase Admin Custom Claims • Resend Dispatches</div>
        </div>
      </div>
    </div>
  );
}