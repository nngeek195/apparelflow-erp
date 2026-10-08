'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Shield, Scissors, CheckCircle2, Shirt, Loader2, Sparkles } from 'lucide-react';

export default function RoleSwitcher() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const demoAccounts = [
    {
      role: 'System Admin',
      targetPath: '/admin',
      email: 'nadmin@gmail.com',
      password: 'password123',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      color: 'bg-[#24173d] text-amber-300 border-amber-500/40 hover:bg-[#311f52] hover:border-amber-400',
      badge: 'All Access',
    },
    {
      role: 'Cutting Supervisor',
      targetPath: '/cutting-supervisor',
      email: 'cuttingadmin@gmail.com',
      password: 'password123',
      icon: <Scissors className="w-4 h-4 text-purple-300" />,
      color: 'bg-[#1e1333] text-purple-200 border-purple-800/60 hover:bg-[#2b1b47] hover:border-purple-600',
      badge: 'Cutting Floor',
    },
    {
      role: 'Cutting Verifier',
      targetPath: '/verification',
      email: 'verifieradmin@gmail.com',
      password: 'password123',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      color: 'bg-[#172225] text-emerald-300 border-emerald-800/60 hover:bg-[#1f2f33] hover:border-emerald-600',
      badge: 'QC Terminal',
    },
    {
      role: 'Sewing Supervisor',
      targetPath: '/sewing',
      email: 'sewingadmin@gmail.com',
      password: 'password123',
      icon: <Shirt className="w-4 h-4 text-amber-300" />,
      color: 'bg-[#261c16] text-amber-200 border-amber-700/60 hover:bg-[#362720] hover:border-amber-500',
      badge: 'Assembly Line',
    },
  ];

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    setLoading(account.email);
    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (!error) {
      router.refresh();
      router.push(account.targetPath);
    } else {
      alert(`Login failed: ${error.message}`);
      setLoading(null);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-purple-900/40">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Evaluator 1-Click Role Switcher</span>
        </div>
        <p className="text-xs text-slate-400">Instantly sign in as each administrator to evaluate role separation</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            onClick={() => handleDemoLogin(account)}
            disabled={loading !== null}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition shadow-md ${account.color} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                {loading === account.email ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : account.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{account.role}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{account.email}</div>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/50 text-slate-300 border border-white/5">
              {account.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}