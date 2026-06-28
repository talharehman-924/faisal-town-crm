'use client';

import { useState, useEffect } from 'react';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal forms state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // Form inputs state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState('NEW');
  const [formSource, setFormSource] = useState('WEBSITE');
  const [formAgentId, setFormAgentId] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  // Fetch initial profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, []);

  // Fetch leads and agents
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        source: sourceFilter,
      }).toString();
      
      const res = await fetch(`/api/leads?${query}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/agents');
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchAgents();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormStatus('NEW');
    setFormSource('WEBSITE');
    setFormAgentId('');
    setError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone,
          status: formStatus,
          source: formSource,
          agentId: formAgentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create lead');
      }

      setIsAddOpen(false);
      resetForm();
      fetchLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (lead) => {
    setEditingLead(lead);
    setFormName(lead.name);
    setFormEmail(lead.email);
    setFormPhone(lead.phone || '');
    setFormStatus(lead.status);
    setFormSource(lead.source);
    setFormAgentId(lead.agentId || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone,
          status: formStatus,
          source: formSource,
          agentId: formAgentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update lead');
      }

      setIsEditOpen(false);
      setEditingLead(null);
      resetForm();
      fetchLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClick = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete lead');
      }
      fetchLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAiScore = async (leadId) => {
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) {
        throw new Error('Failed to compute AI lead score');
      }
      fetchLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  const getAiScoreBadge = (score) => {
    if (!score) return 'bg-slate-850 text-slate-500 border-slate-800';
    if (score >= 80) return 'bg-rose-500/10 text-rose-450 border-rose-500/20';
    if (score >= 50) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    return 'bg-slate-800 text-slate-400 border-slate-750';
  };

  const getAiScoreLabel = (score) => {
    if (!score) return 'N/A';
    if (score >= 80) return `${score}% Hot 🔥`;
    if (score >= 50) return `${score}% Warm ⚡`;
    return `${score}% Cold ❄️`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CONTACTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'QUALIFIED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'LOST':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Lead Management</h1>
          <p className="text-slate-400 text-sm mt-1">Acquire, allocate, and filter incoming prospective clients</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer"
        >
          + Add New Lead
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/30 border border-slate-900 rounded-2xl p-4">
        <div className="md:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
            placeholder="Search leads by name, email, or phone..."
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors text-sm"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors text-sm"
          >
            <option value="">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex items-center justify-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            Loading Leads...
          </div>
        ) : leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-450 bg-slate-900/10">
                  <th className="py-4 px-6 font-semibold">Lead Info</th>
                  <th className="py-4 px-6 font-semibold">Contact Info</th>
                  <th className="py-4 px-6 font-semibold text-center">Status</th>
                  <th className="py-4 px-6 font-semibold text-center">AI Score & Insights</th>
                  <th className="py-4 px-6 font-semibold text-center">Source</th>
                  <th className="py-4 px-6 font-semibold">Assigned Agent</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-850/60 hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-100">{lead.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Added: {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      <div>{lead.email}</div>
                      {lead.phone && <div className="text-slate-500 mt-0.5">{lead.phone}</div>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => alert(lead.aiInsights || 'No AI Insights computed yet. Click recalculate.')}
                          className={`inline-flex px-2 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${getAiScoreBadge(lead.aiScore)}`}
                          title="Click to view AI Insights"
                        >
                          {getAiScoreLabel(lead.aiScore)}
                        </button>
                        <button
                          onClick={() => handleAiScore(lead.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-violet-400 transition-colors cursor-pointer"
                          title="Recalculate AI Score"
                        >
                          🔄
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-semibold text-slate-400">
                      {lead.source}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {lead.agent ? lead.agent.name : 'Unassigned'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setFormName(lead.name);
                            setFormEmail(lead.email);
                            setFormPhone(lead.phone || '');
                            setFormStatus(lead.status);
                            setFormSource(lead.source);
                            setFormAgentId(lead.agentId || '');
                            setIsEditOpen(true);
                          }}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(lead.id)}
                          className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/10 transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 text-sm">
            No leads found matching current criteria.
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-3">Add New Lead</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="e.g. 03001234567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Source</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {currentUser && currentUser.role === 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Agent</label>
                  <select
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-3">Edit Lead Details</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Source</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {currentUser && currentUser.role === 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Agent</label>
                  <select
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingLead(null);
                    resetForm();
                  }}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
