'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        router.push('/login');
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Leads', path: '/dashboard/leads', icon: '👤' },
    { name: 'Properties', path: '/dashboard/properties', icon: '🏠' },
    { name: 'Deals', path: '/dashboard/deals', icon: '💼' },
    { name: 'Settings', path: '/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-4 z-40">
        <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          FAISAL TOWN CRM
        </span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-400 hover:text-white focus:outline-none text-2xl"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar navigation */}
      <aside
        className={`${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800/80 p-6 flex flex-col justify-between z-30 transition-transform duration-300 ease-in-out md:h-screen`}
      >
        <div className="space-y-8">
          <div className="hidden md:block">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              FAISAL TOWN CRM
            </span>
            <div className="h-px bg-slate-800/60 mt-4"></div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-300'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-slate-800 pt-6">
          {user && (
            <div className="flex items-center justify-between mb-4 bg-slate-955 p-3 rounded-lg border border-slate-850">
              <div className="overflow-hidden pr-2">
                <div className="text-sm font-bold text-slate-200 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded transition-all cursor-pointer"
                title="Log out"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main panel content */}
      <main className="flex-1 md:h-screen md:overflow-y-auto bg-slate-950">
        {children}
      </main>
    </div>
  );
}
