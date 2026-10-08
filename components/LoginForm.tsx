'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import RoleSwitcher from '@/components/RoleSwitcher';
import { Lock, Mail, Shield, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message || 'Login failed.');
      setSubmitting(false);
    } else {
      router.refresh();
      const role = data.user?.user_metadata?.role?.toUpperCase();
      switch (role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'CUTTING_SUPERVISOR':
          router.push('/cutting-supervisor');
          break;
        case 'CUTTING_VERIFIER':
          router.push('/verification');
          break;
        case 'SEWING_SUPERVISOR':
          router.push('/sewing');
          break;
        default:
          router.push('/dashboard');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0714] p-4 sm:p-6">
      <div className="w-full max-w-lg bg-[#160d24] border border-[#372458] rounded-2xl shadow-2xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/30 border border-amber-500/30 mb-3 shadow-inner">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ApparelFlow ERP</h1>
          <p className="text-xs text-slate-400 mt-1">Multi-Role Manufacturing & Quality Verification Portal</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0d0714] border border-[#372458] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-white text-sm outline-none transition placeholder-slate-600"
                placeholder="staff@apparelflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0d0714] border border-[#372458] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-white text-sm outline-none transition placeholder-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Workplace'}</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </form>

        {/* 1-Click Role Switcher for Assessment Evaluation */}
        <RoleSwitcher />
      </div>
    </div>
  );
}