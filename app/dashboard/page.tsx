'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { RefreshCw, Shield, Sparkles } from 'lucide-react';

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const rawRole = user.role || '';
      const role = rawRole.toUpperCase();

      switch (role) {
        case 'ADMIN':
          router.replace('/admin');
          break;
        case 'CUTTING_SUPERVISOR':
          router.replace('/cutting-supervisor');
          break;
        case 'CUTTING_VERIFIER':
          router.replace('/verification');
          break;
        case 'SEWING_SUPERVISOR':
          router.replace('/sewing');
          break;
        default:
          router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex-1 min-h-[85vh] flex items-center justify-center bg-[#0d0714] text-slate-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#160d24] border border-[#372458] shadow-2xl">
        <div className="relative">
          <RefreshCw className="w-10 h-10 animate-spin text-amber-400" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-300" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-base font-black text-white">Navigating Workplace</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Routing to designated departmental dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}