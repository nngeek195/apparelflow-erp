'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 mb-3 shadow-xs">
            <Shield className="w-7 h-7 text-purple-700" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ApparelFlow ERP</h1>
          <p className="text-xs text-slate-500 mt-1">Multi-Role Manufacturing & Quality Verification Portal</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 rounded-xl text-slate-900 text-sm outline-none transition placeholder-slate-400"
                placeholder="staff@apparelflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 rounded-xl text-slate-900 text-sm outline-none transition placeholder-slate-400"
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
            className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Workplace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}