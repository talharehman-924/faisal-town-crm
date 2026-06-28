'use client';

import { useState, useEffect } from 'react';

export default function DeveloperPortalPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/developer/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setNewlyCreatedKey('');

    if (!keyName) {
      setError('Please provide a name descriptor for the integration token.');
      return;
    }

    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate token');
      }

      const data = await res.json();
      setNewlyCreatedKey(data.apiKey.key);
      setMessage(`API Key "${data.apiKey.name}" generated successfully. Copy it now, it won't be shown again!`);
      setKeyName('');
      fetchKeys();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key? External integrations using this key will fail immediately.')) return;
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/developer/keys/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to revoke token');
      }

      setMessage('API Key successfully revoked.');
      fetchKeys();
    } catch (err) {
      setError(err.message);
    }
  };

  const maskKey = (k) => {
    return `${k.substring(0, 7)}*****************`;
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Developer API Portal</h1>
        <p className="text-slate-400 text-sm mt-1">Generate client tokens and view interactive integration docs for external webhooks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Manager */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-6 shadow-lg lg:col-span-1">
          <div>
            <h3 className="font-extrabold text-slate-200 text-base">Generate API Key</h3>
            <p className="text-xs text-slate-500 mt-1">Create tokens to authenticate external REST integrations</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-semibold space-y-2">
              <div>{message}</div>
              {newlyCreatedKey && (
                <div className="p-2 bg-slate-950 rounded font-mono text-[10px] select-all break-all border border-emerald-500/20 text-emerald-300 font-bold">
                  {newlyCreatedKey}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleGenerateKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Token Name (Integration Label)</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                placeholder="e.g. Zapier Lead Capture"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2 rounded-lg text-sm transition-all cursor-pointer"
            >
              Generate Token
            </button>
          </form>

          {/* Active Keys Table */}
          <div className="pt-6 border-t border-slate-850/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Credentials</h4>
            {loading ? (
              <div className="text-center text-xs text-slate-500 py-4">Loading keys...</div>
            ) : keys.length > 0 ? (
              <div className="space-y-3">
                {keys.map((k) => (
                  <div key={k.id} className="bg-slate-950/30 border border-slate-850 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-350">{k.name}</div>
                      <div className="font-mono text-[10px] text-slate-550">{maskKey(k.key)}</div>
                    </div>
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-350 cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-650 py-4 italic">No active developer keys.</div>
            )}
          </div>
        </div>

        {/* Developer Documentation */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-6 shadow-lg lg:col-span-2">
          <div>
            <h3 className="font-extrabold text-slate-200 text-base">API Documentation</h3>
            <p className="text-xs text-slate-500 mt-1">Reference manuals and payload templates for consuming CRM endpoints</p>
          </div>

          <div className="space-y-6">
            {/* Headers Info */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 text-xs space-y-2">
              <span className="font-bold text-slate-350">Authentication Headers</span>
              <p className="text-slate-500 leading-relaxed">External requests require token headers. Generate a key on the left and append it to all requests:</p>
              <div className="p-2.5 bg-slate-950 rounded font-mono text-[10px] border border-slate-850 text-slate-400 leading-relaxed">
                Authorization: Bearer YOUR_API_KEY
              </div>
            </div>

            {/* Endpoints List */}
            <div className="space-y-4">
              {/* Endpoint 1: Leads */}
              <div className="border border-slate-850/60 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-950/40 p-3 border-b border-slate-850/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-bold text-[9px]">GET</span>
                    <span className="font-bold text-slate-300 font-mono">/api/leads</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Retrieve scoped leads</span>
                </div>
                <div className="p-4 bg-slate-955 space-y-3">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Response Structure</div>
                  <pre className="p-3 bg-slate-950 rounded text-[10px] text-violet-400 font-mono overflow-x-auto leading-relaxed">
{`{
  "leads": [
    {
      "id": "7871bfa7-3914-41d9-813d-1a877ff4191c",
      "name": "Ahmed Ali",
      "email": "ahmed@gmail.com",
      "status": "NEW",
      "source": "WEBSITE",
      "agentId": "5f1b2b8c-5722-48df-aa7a-24151efbf9ab"
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              {/* Endpoint 2: Properties */}
              <div className="border border-slate-850/60 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-950/40 p-3 border-b border-slate-850/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-bold text-[9px]">GET</span>
                    <span className="font-bold text-slate-300 font-mono">/api/properties</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Query listings inventory</span>
                </div>
                <div className="p-4 bg-slate-955 space-y-3">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Response Structure</div>
                  <pre className="p-3 bg-slate-950 rounded text-[10px] text-violet-400 font-mono overflow-x-auto leading-relaxed">
{`{
  "properties": [
    {
      "id": "18ac2cf1-b752-4752-95f2-53b036ca14ab",
      "title": "10 Marla Luxury Villa",
      "price": 42000000,
      "address": "Plot 412, Block B, Faisal Town",
      "status": "AVAILABLE",
      "type": "RESIDENTIAL"
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              {/* Endpoint 3: Create Lead */}
              <div className="border border-slate-850/60 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-950/40 p-3 border-b border-slate-850/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-violet-500/10 text-violet-400 border border-violet-500/25 px-1.5 py-0.5 rounded font-bold text-[9px]">POST</span>
                    <span className="font-bold text-slate-300 font-mono">/api/leads</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Inject incoming external lead</span>
                </div>
                <div className="p-4 bg-slate-955 space-y-4">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Payload Request Body</div>
                    <pre className="p-3 bg-slate-950 rounded text-[10px] text-cyan-400 font-mono overflow-x-auto leading-relaxed">
{`{
  "name": "Hamza Abbasi",
  "email": "hamza@gmail.com",
  "phone": "03123456789",
  "source": "ZAPIER_EXTERNAL"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
