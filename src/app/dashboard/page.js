'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, activityRes, rolesRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity'),
          fetch('/api/roles'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (activityRes.ok) {
          const actData = await activityRes.json();
          setActivities(actData.activities || []);
        }
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setSystemData(rolesData);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time statistics & system audit logs for Faisal Town CRM</p>
      </div>

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Sales Volume */}
          <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Sales Volume</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 truncate">
              {formatCurrency(stats.totalSalesVolume)}
            </div>
            <div className="text-xs text-slate-500 mt-2">Sum of Closed-Won Deals</div>
          </div>

          {/* Card 2: Active Listings */}
          <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Listings</span>
              <span className="text-2xl">🏠</span>
            </div>
            <div className="text-3xl font-black text-cyan-400">
              {stats.activeListingsCount}
            </div>
            <div className="text-xs text-slate-500 mt-2">Properties available on portal</div>
          </div>

          {/* Card 3: Open Deals */}
          <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Open Negotiations</span>
              <span className="text-2xl">💼</span>
            </div>
            <div className="text-3xl font-black text-violet-400">
              {stats.openDealsCount}
            </div>
            <div className="text-xs text-slate-500 mt-2">Active pipeline negotiations</div>
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Deal Conversion</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-black text-amber-400">
              {stats.conversionRate}%
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${stats.conversionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Activities Feed (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-850 pb-4">
            <h2 className="text-lg font-bold text-slate-100">Recent Activities Feed</h2>
            <p className="text-xs text-slate-500 mt-0.5">Timeline of recent events and updates</p>
          </div>

          <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-6">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="relative">
                  {/* Bullet */}
                  <span className="absolute -left-[31px] top-1 bg-slate-950 border border-slate-800 w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.6)]"></span>
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-200">{act.action}</span>
                    <p className="text-xs text-slate-400 mt-1">{act.details}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-500">By {act.user?.name || 'System'}</span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 pl-2">No activities recorded yet.</p>
            )}
          </div>
        </div>

        {/* Roles & Matrix (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-850 pb-4">
            <h2 className="text-lg font-bold text-slate-100">Role Capabilities Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">Database RBAC controls</p>
          </div>

          {systemData ? (
            <div className="space-y-4">
              {systemData.roles.map((role) => (
                <div key={role.id} className="bg-slate-955 border border-slate-900 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-extrabold text-slate-200">{role.name}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                      {role.permissions.length} perms
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{role.description}</div>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {role.permissions.map((p) => (
                      <span key={p.id} className="text-[9px] bg-slate-900/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-900">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Failed to load permissions matrix.</p>
          )}
        </div>
      </div>
    </div>
  );
}
