'use client';

import { useState, useEffect } from 'react';

export default function DeploymentPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [building, setBuilding] = useState(false);
  const [logs, setLogs] = useState('');
  const [buildResult, setBuildResult] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRunBuild = async () => {
    setBuilding(true);
    setLogs('Initializing Next.js production compiler...\nGenerating optimized bundles...\nChecking for TypeScript/Linting checks...');
    setBuildResult(null);

    try {
      const res = await fetch('/api/testing/build', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Build verification failed to compile');
      }

      const data = await res.json();
      setLogs(data.log || 'Compilation finished with no stdout log.');
      setBuildResult(data.success ? 'COMPILED' : 'FAILED');
    } catch (err) {
      setLogs(prev => `${prev}\n\n❌ COMPILATION ERROR: ${err.message}`);
      setBuildResult('FAILED');
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Deployment & Production</h1>
          <p className="text-slate-400 text-sm mt-1">Verify production bundle compiles, inspect settings, and view container setups</p>
        </div>
        <button
          onClick={handleRunBuild}
          disabled={building || currentUser?.role !== 'ADMIN'}
          className={`font-semibold px-5 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
            currentUser?.role === 'ADMIN' && !building
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg'
              : 'bg-slate-900 text-slate-600 border border-slate-900 cursor-not-allowed'
          }`}
        >
          {building ? 'Compiling next...' : 'Verify Production Build 🚀'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configurations checklist */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-6 shadow-lg lg:col-span-1">
          <div>
            <h3 className="font-extrabold text-slate-200 text-base">Production Readiness Checks</h3>
            <p className="text-xs text-slate-500 mt-1">CRM configuration settings check</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-850">
              <span className="text-slate-400">Database Driver</span>
              <span className="text-emerald-400 font-bold">SQLite Persistence</span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-850">
              <span className="text-slate-400">Prisma Client ORM</span>
              <span className="text-emerald-400 font-bold">v6.19.3</span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-850">
              <span className="text-slate-400">Branding Scope</span>
              <span className="text-emerald-400 font-bold">FAISAL TOWN CRM</span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-850">
              <span className="text-slate-400">Route Guards Protection</span>
              <span className="text-emerald-400 font-bold">Next Edge Middleware</span>
            </div>
          </div>

          {/* Docker setup info */}
          <div className="pt-6 border-t border-slate-850 space-y-4">
            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Docker Deployment Manual</h4>
            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850 text-[10px] text-slate-400 font-mono leading-relaxed space-y-3">
              <div>
                <span className="text-slate-550"># Build container:</span>
                <span className="text-cyan-300 block mt-1">docker build -t faisaltown-crm .</span>
              </div>
              <div>
                <span className="text-slate-550"># Run container (port 3000):</span>
                <span className="text-cyan-300 block mt-1">docker run -d -p 3000:3000 --name crm faisaltown-crm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live build console output */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-lg lg:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-200 text-base">Production Compilation Logger</h3>
                <p className="text-xs text-slate-500 mt-0.5">Execution logs console stdout / stderr</p>
              </div>

              {buildResult && (
                <span className={`px-2.5 py-1 rounded text-xs font-black border ${
                  buildResult === 'COMPILED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                }`}>
                  {buildResult}
                </span>
              )}
            </div>

            {/* Console output viewport */}
            <div className="bg-black/85 border border-slate-950 rounded-xl p-4 h-96 overflow-y-auto text-xs text-violet-400 font-mono leading-relaxed whitespace-pre-wrap flex-1 min-h-[350px]">
              {logs || 'Ready. Click "Verify Production Build" above to test Next.js compiler. (Admin access only)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
