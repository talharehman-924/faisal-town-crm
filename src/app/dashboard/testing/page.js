'use client';

import { useState, useEffect } from 'react';

export default function TestingPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState('');
  const [testResult, setTestResult] = useState(null);

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

  const handleRunTests = async () => {
    setRunning(true);
    setLogs('Initializing test environment...\nRunning migrations check...\nExecuting 37 integration test cases...');
    setTestResult(null);

    try {
      const res = await fetch('/api/testing/run', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete execution run');
      }

      const data = await res.json();
      setLogs(data.log || 'Execution finished with no log output.');
      setTestResult(data.success ? 'PASSED' : 'FAILED');
    } catch (err) {
      setLogs(prev => `${prev}\n\n❌ ERROR: ${err.message}`);
      setTestResult('FAILED');
    } finally {
      setRunning(false);
    }
  };

  const testSuites = [
    { name: 'Phase 1: Authentication & Roles', checks: 3, file: 'test-auth.js' },
    { name: 'Phase 2: Analytics Dashboard', checks: 4, file: 'test-dashboard.js' },
    { name: 'Phase 3: Lead Management', checks: 4, file: 'test-leads.js' },
    { name: 'Phase 4: Property Listings', checks: 4, file: 'test-properties.js' },
    { name: 'Phase 5: Deal Pipeline Kanban', checks: 4, file: 'test-deals.js' },
    { name: 'Phase 6: Buyer Match Preferences', checks: 3, file: 'test-buyers.js' },
    { name: 'Phase 7: Marketing Campaigns', checks: 3, file: 'test-marketing.js' },
    { name: 'Phase 8: AI Score & Copywriter', checks: 3, file: 'test-ai.js' },
    { name: 'Phase 9: Performance Reports', checks: 3, file: 'test-reports.js' },
    { name: 'Phase 10: System Configurations', checks: 3, file: 'test-settings.js' },
    { name: 'Phase 11: Developer ApiKeys', checks: 3, file: 'test-apikeys.js' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">QA Test Suite Console</h1>
          <p className="text-slate-400 text-sm mt-1">Execute automated test cases across all modules and review terminal logs</p>
        </div>
        <button
          onClick={handleRunTests}
          disabled={running || currentUser?.role !== 'ADMIN'}
          className={`font-semibold px-5 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
            currentUser?.role === 'ADMIN' && !running
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg'
              : 'bg-slate-900 text-slate-600 border border-slate-900 cursor-not-allowed'
          }`}
        >
          {running ? 'Running Tests...' : 'Run Full Suite 🚀'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Test Suites list */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-6 shadow-lg lg:col-span-1">
          <div>
            <h3 className="font-extrabold text-slate-200 text-base">Configured Test Suites</h3>
            <p className="text-xs text-slate-500 mt-1">Current validation files list (37 checks total)</p>
          </div>

          <div className="space-y-3">
            {testSuites.map((s) => (
              <div key={s.file} className="bg-slate-950/40 border border-slate-850 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-300">{s.name}</div>
                  <div className="text-[10px] text-slate-550 mt-0.5 font-mono">{s.file}</div>
                </div>
                <span className="bg-slate-900 px-2 py-0.5 border border-slate-850 rounded text-slate-450 font-bold font-mono text-[10px]">
                  {s.checks} checks
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Logger Console */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-lg lg:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-200 text-base">Terminal Log Outputs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Execution logs console stdout / stderr</p>
              </div>

              {testResult && (
                <span className={`px-2.5 py-1 rounded text-xs font-black border ${
                  testResult === 'PASSED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                }`}>
                  {testResult}
                </span>
              )}
            </div>

            {/* Console output viewport */}
            <div className="bg-black/85 border border-slate-950 rounded-xl p-4 h-96 overflow-y-auto text-xs text-violet-400 font-mono leading-relaxed whitespace-pre-wrap flex-1 min-h-[350px]">
              {logs || 'Ready. Click "Run Full Suite" above to execute tests. (Admin access only)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
