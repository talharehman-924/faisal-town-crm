'use client';

import { useState, useEffect } from 'react';

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);

  // Form inputs state
  const [formTitle, setFormTitle] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formStatus, setFormStatus] = useState('NEGOTIATION');
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formLeadId, setFormLeadId] = useState('');
  const [formAgentId, setFormAgentId] = useState('');

  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const stages = ['NEGOTIATION', 'UNDER_CONTRACT', 'CLOSED_WON', 'CLOSED_LOST'];

  // Fetch session profile
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

  const fetchDealsAndRelations = async () => {
    setLoading(true);
    try {
      const [dealsRes, propsRes, leadsRes, agentsRes] = await Promise.all([
        fetch('/api/deals'),
        fetch('/api/properties'),
        fetch('/api/leads'),
        fetch('/api/agents'),
      ]);

      if (dealsRes.ok) {
        const dealsData = await dealsRes.json();
        setDeals(dealsData.deals || []);
      }
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        setProperties(propsData.properties || []);
      }
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
      }
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealsAndRelations();
  }, []);

  const resetForm = () => {
    setFormTitle('');
    setFormValue('');
    setFormStatus('NEGOTIATION');
    setFormPropertyId('');
    setFormLeadId('');
    setFormAgentId('');
    setError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formPropertyId || !formLeadId) {
      setError('Please select both a property listing and a lead.');
      return;
    }

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          value: parseFloat(formValue),
          status: formStatus,
          propertyId: formPropertyId,
          leadId: formLeadId,
          agentId: formAgentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create deal');
      }

      setIsAddOpen(false);
      resetForm();
      fetchDealsAndRelations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (deal) => {
    setEditingDeal(deal);
    setFormTitle(deal.title);
    setFormValue(deal.value);
    setFormStatus(deal.status);
    setFormPropertyId(deal.propertyId);
    setFormLeadId(deal.leadId);
    setFormAgentId(deal.agentId || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`/api/deals/${editingDeal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          value: parseFloat(formValue),
          status: formStatus,
          propertyId: formPropertyId,
          leadId: formLeadId,
          agentId: formAgentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update deal');
      }

      setIsEditOpen(false);
      setEditingDeal(null);
      resetForm();
      fetchDealsAndRelations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickMove = async (deal, newStage) => {
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deal.title,
          value: deal.value,
          status: newStage,
          propertyId: deal.propertyId,
          leadId: deal.leadId,
          agentId: deal.agentId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update stage');
      }
      fetchDealsAndRelations();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteClick = async (dealId) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete deal');
      }
      fetchDealsAndRelations();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStageHeaderStyle = (stage) => {
    switch (stage) {
      case 'NEGOTIATION':
        return 'border-violet-500/30 text-violet-400 bg-violet-500/5';
      case 'UNDER_CONTRACT':
        return 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5';
      case 'CLOSED_WON':
        return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
      case 'CLOSED_LOST':
        return 'border-rose-500/30 text-rose-400 bg-rose-500/5';
      default:
        return 'border-slate-800 text-slate-400 bg-slate-900/10';
    }
  };

  const getDealsByStage = (stage) => {
    return deals.filter((deal) => deal.status === stage);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Deals Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">Group, track, and close active contract negotiations</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer"
        >
          + Create New Deal
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading Deal Pipeline...
        </div>
      ) : (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {stages.map((stage) => {
            const stageDeals = getDealsByStage(stage);
            const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div key={stage} className="bg-slate-900/20 border border-slate-900/80 rounded-2xl p-4 flex flex-col space-y-4">
                {/* Column Header */}
                <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${getStageHeaderStyle(stage)}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black tracking-wider">{stage.replace('_', ' ')}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/60">{stageDeals.length}</span>
                  </div>
                  <div className="text-xs font-semibold opacity-80">{formatCurrency(totalValue)}</div>
                </div>

                {/* Deal Cards Container */}
                <div className="space-y-3 min-h-[300px]">
                  {stageDeals.length > 0 ? (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4 transition-all duration-155 group"
                      >
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-slate-100 group-hover:text-violet-400 transition-colors">{deal.title}</h4>
                          
                          {/* Property & Lead descriptions */}
                          <div className="space-y-1">
                            <div className="text-[10px] text-slate-400 truncate">
                              🏠 <span className="font-semibold text-slate-350">{deal.property.title}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              👤 <span className="font-semibold text-slate-350">{deal.lead.name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Value & Quick actions */}
                        <div className="border-t border-slate-850/60 pt-3 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-cyan-400">{formatCurrency(deal.value)}</span>
                            
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleEditClick(deal)}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(deal.id)}
                                className="text-[10px] bg-rose-500/10 hover:bg-rose-500/25 text-rose-450 px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Quick Stage Transitions */}
                          <div className="flex justify-between gap-1 pt-1.5 border-t border-slate-850/40">
                            {stage !== 'CLOSED_WON' && (
                              <button
                                onClick={() => handleQuickMove(deal, 'CLOSED_WON')}
                                className="flex-1 text-[8px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-450 py-1 rounded font-bold border border-emerald-500/10 transition-all cursor-pointer text-center"
                              >
                                Win 👍
                              </button>
                            )}
                            {stage !== 'CLOSED_LOST' && (
                              <button
                                onClick={() => handleQuickMove(deal, 'CLOSED_LOST')}
                                className="flex-1 text-[8px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 py-1 rounded font-bold border border-rose-500/10 transition-all cursor-pointer text-center"
                              >
                                Lose 👎
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-[11px] text-slate-600 italic">No deals in this stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Deal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-fade-in">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-3">Initiate New Deal</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deal Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="e.g. Zahid Villa Negotiation"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Linked Property Listing</label>
                  <select
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-350 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  >
                    <option value="">Select Property...</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({formatCurrency(p.price)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Linked Lead Prospect</label>
                  <select
                    value={formLeadId}
                    onChange={(e) => setFormLeadId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-350 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  >
                    <option value="">Select Lead...</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Value (PKR)</label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    placeholder="e.g. 42000000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Stage</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="UNDER_CONTRACT">Under Contract</option>
                    <option value="CLOSED_WON">Closed Won</option>
                    <option value="CLOSED_LOST">Closed Lost</option>
                  </select>
                </div>
              </div>

              {currentUser && currentUser.role === 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Agent</label>
                  <select
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="">Select Agent...</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
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
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Deal Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-fade-in">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-3">Edit Deal Details</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deal Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Linked Property Listing</label>
                  <select
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-355 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({formatCurrency(p.price)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Linked Lead Prospect</label>
                  <select
                    value={formLeadId}
                    onChange={(e) => setFormLeadId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-355 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Value (PKR)</label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Stage</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="UNDER_CONTRACT">Under Contract</option>
                    <option value="CLOSED_WON">Closed Won</option>
                    <option value="CLOSED_LOST">Closed Lost</option>
                  </select>
                </div>
              </div>

              {currentUser && currentUser.role === 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Agent</label>
                  <select
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingDeal(null);
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
