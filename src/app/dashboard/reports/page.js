'use client';

import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getSourceIcon = (src) => {
    switch (src) {
      case 'WEBSITE': return '🌐';
      case 'REFERRAL': return '🤝';
      case 'SOCIAL_MEDIA': return '📱';
      default: return '📍';
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Aggregate CRM performance, agent sales leaders, and source conversion efficiency metrics</p>
      </div>

      {loading ? (
        <div className="py-40 flex items-center justify-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Calculating Reports metrics...
        </div>
      ) : reportData ? (
        <div className="space-y-8 animate-fade-in">
          {/* Header Stats Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Leads Active</span>
              <h2 className="text-3xl font-black text-slate-100 mt-2">{reportData.leads.total}</h2>
              <span className="text-xs text-slate-400 mt-2 block">Acquired client prospects</span>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Qualified Leads</span>
              <h2 className="text-3xl font-black text-cyan-400 mt-2">{reportData.leads.qualified}</h2>
              <span className="text-xs text-slate-400 mt-2 block">Verified hot buyers</span>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Lead Conversion Ratio</span>
              <h2 className="text-3xl font-black text-violet-400 mt-2">{reportData.leads.conversionRate}%</h2>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-violet-500 h-full rounded-full" style={{ width: `${reportData.leads.conversionRate}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Properties Inventory</span>
              <h2 className="text-3xl font-black text-emerald-400 mt-2">{reportData.properties.total}</h2>
              <span className="text-xs text-slate-400 mt-2 block">{reportData.properties.available} Available for Sale</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent Leaderboard */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-lg lg:col-span-2 space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-200 text-lg">Agent Performance Leaderboard</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ranked by total CLOSED_WON sales volume</p>
              </div>

              {reportData.leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {reportData.leaderboard.map((agent, index) => (
                    <div 
                      key={agent.id}
                      className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-850 flex items-center justify-center font-black text-xs text-slate-300">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm">{agent.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{agent.email}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-xs text-emerald-400 font-black">{formatCurrency(agent.salesVolume)}</div>
                        <div className="text-[9px] text-slate-550">
                          {agent.leadCount} Leads Assigned | {agent.dealCount} Deals
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 text-xs italic">
                  No agents registered in system.
                </div>
              )}
            </div>

            {/* Inventory Distribution */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-lg space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-200 text-lg">Inventory Status Allocation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Current property portfolio listings counts</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Available Listings</span>
                    <span className="text-slate-200 font-bold">{reportData.properties.available}</span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(reportData.properties.available / reportData.properties.total) * 100}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Pending Signings</span>
                    <span className="text-slate-200 font-bold">{reportData.properties.pending}</span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(reportData.properties.pending / reportData.properties.total) * 100}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Closed (Sold)</span>
                    <span className="text-slate-200 font-bold">{reportData.properties.sold}</span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(reportData.properties.sold / reportData.properties.total) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Source Acquisition Efficiency */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-lg space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-200 text-lg">Lead Source Acquisition & Efficiency</h3>
              <p className="text-xs text-slate-500 mt-0.5">Analyzing qualified lead conversion ratios per channel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {reportData.sourceMetrics.map((src) => (
                <div key={src.source} className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">{getSourceIcon(src.source)}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{src.source}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 font-semibold">Conversion Rate</div>
                    <div className="text-xl font-black text-violet-400">{src.conversion.toFixed(1)}%</div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {src.qualified} qualified / {src.total} total leads
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 text-sm">
          Failed to load reports overview.
        </div>
      )}
    </div>
  );
}
