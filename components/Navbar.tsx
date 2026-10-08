'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    // Sign out of Supabase (clears cookies automatically)
    await supabase.auth.signOut();
    
    router.refresh();
    router.push('/login');
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link href="/" className="font-bold text-xl tracking-wide">
        ApparelFlow ERP
      </Link>
      
      <div>
        {user ? (
          <div className="flex gap-6 items-center">
            <span className="text-sm text-gray-400 hidden sm:inline-block">
              {user.email}
            </span>
            <Link href="/dashboard" className="text-sm hover:text-gray-300 transition">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition"
          >
            Admin Login
          </Link>
        )}
      </div>
    </nav>
  );
}