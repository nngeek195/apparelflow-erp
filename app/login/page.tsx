"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import {
  Scissors,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { signInWithCredentials, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await signInWithCredentials(email, password);
    if (res.success) {
      router.push(redirectPath);
    } else {
      setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);
    const res = await signInWithGoogle();
    if (res.success) {
      router.push(redirectPath);
    } else {
      setErrorMessage(res.error || 'Google Authentication failed.');
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background radial accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center text-white shadow-xl shadow-indigo-500/25">
            <Scissors className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ApparelFlow <span className="text-indigo-400 font-mono font-medium">ERP</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Manufacturing Operations Portal
            </p>
          </div>
        </div>

        {/* Access Restriction Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white block">Restricted System Access</span>
            <span className="text-[11px] text-slate-400">
              Please enter your administrator credentials to authenticate your session via JWT.
            </span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Email & Password Form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || loadingGoogle}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & JWT...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Credentials</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-800" />
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Or OAuth Login
            </span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          {/* Google OAuth Option */}
          <button
            onClick={handleGoogleSubmit}
            disabled={loading || loadingGoogle}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-center gap-2.5 transition disabled:opacity-60 cursor-pointer"
          >
            {loadingGoogle ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.71-4.93H1.26v3.13C3.27 21.37 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.29 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.6H1.26C.46 8.21 0 10.05 0 12s.46 3.79 1.26 5.4l4.03-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.77c1.76 0 3.35.61 4.6 1.79l3.43-3.43C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.63 1.26 6.6l4.03 3.13c.95-2.83 3.59-4.96 6.71-4.96z"
                />
              </svg>
            )}
            <span>Sign in with Google OAuth</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-xs">
          Loading login portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}