'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Shield, Scissors, CheckCircle2, Shirt, Loader2 } from 'lucide-react';

export default function RoleSwitcher() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const demoAccounts = [
    {
      role: 'System Admin',
      email: 'nadmin@gmail.com',
      password: 'password123', // Replace with the actual password you used during setup
      icon: <Shield className="w-4 h-4" />,
      color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
    },
    {
      role: 'Cutting Supervisor',
      email: 'cuttingadmin@gmail.com',
      password: 'password123',
      icon: <Scissors className="w-4 h-4" />,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
    },
    {
      role: 'Cutting Verifier',
      email: 'verifieradmin@gmail.com',
      password: 'password123',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20',
    },
    {
      role: 'Sewing Supervisor',
      email: 'sewingadmin@gmail.com',
      password: 'password123',
      icon: <Shirt className="w-4 h-4" />,
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20',
    },
  ];

  const handleDemoLogin = async (email: string, pass: string) => {
    setLoading(email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (!error) {
      router.refresh();
      router.push('/dashboard');
    } else {
      alert(`Login failed: ${error.message}`);
      setLoading(null);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="text-center mb-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Evaluator Role Switcher</h3>
        <p className="text-xs text-slate-500 mt-1">One-click login for technical assessment</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            onClick={() => handleDemoLogin(account.email, account.password)}
            disabled={loading !== null}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${account.color} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading === account.email ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : account.icon}
            <div>
              <div className="text-xs font-bold">{account.role}</div>
              <div className="text-[10px] opacity-80 font-mono">{account.email}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}