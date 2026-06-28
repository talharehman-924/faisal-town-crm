'use client';

import { useState, useEffect } from 'react';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formAudience, setFormAudience] = useState('ALL_LEADS');
  const [error, setError] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!formTitle) {
      alert('Please enter an Internal Title first so AI can use it as context.');
      return;
    }
    setAiGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          targetAudience: formAudience,
        }),
      });

      if (!res.ok) {
        throw new Error('AI generation failed');
      }

      const data = await res.json();
      setFormSubject(data.subject || '');
      setFormBody(data.body || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const resetForm = () => {
    setFormTitle('');
    setFormSubject('');
    setFormBody('');
    setFormAudience('ALL_LEADS');
    setError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          subject: formSubject,
          body: formBody,
          targetAudience: formAudience,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save campaign template');
      }

      setIsAddOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendCampaign = async (id) => {
    setSendingId(id);
    try {
      const res = await fetch(`/api/marketing/${id}/send`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Simulated broadcast delivery failed');
      }

      const data = await res.json();
      alert(`Broadcast complete! Successfully sent to ${data.targetCount} contacts.`);
      fetchCampaigns();
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DRAFT':
      default:
        return 'bg-slate-800 text-slate-450 border-slate-700';
    }
  };

  const getAudienceText = (audience) => {
    switch (audience) {
      case 'ALL_LEADS':
        return 'All Contacts';
      case 'NEW_LEADS':
        return 'New Leads Only';
      case 'QUALIFIED_LEADS':
        return 'Qualified Leads';
      default:
        return audience;
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Marketing Campaigns</h1>
          <p className="text-slate-400 text-sm mt-1">Design email templates and broadcast updates to lead segments</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer"
        >
          + Draft Campaign
        </button>
      </div>

      {/* Campaigns Grid Layout */}
      {loading ? (
        <div className="py-20 flex items-center justify-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading Campaigns...
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-slate-900/40 border border-slate-900 hover:border-slate-850 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-6 transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850/80 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-200 text-base">{camp.title}</h3>
                    <span className="text-[10px] text-slate-500">Segment: {getAudienceText(camp.targetAudience)}</span>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(camp.status)}`}>
                    {camp.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="text-slate-500 font-semibold block">Subject Title</span>
                    <span className="text-slate-300 font-medium block mt-0.5">{camp.subject}</span>
                  </div>
                  <div className="text-xs bg-slate-950/40 border border-slate-850 rounded-lg p-3 h-28 overflow-y-auto text-slate-400 font-mono leading-relaxed">
                    {camp.body}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-850/60 pt-4">
                <span className="text-[10px] text-slate-500">
                  Created: {new Date(camp.createdAt).toLocaleDateString()}
                </span>
                
                {camp.status === 'DRAFT' ? (
                  <button
                    onClick={() => handleSendCampaign(camp.id)}
                    disabled={sendingId === camp.id}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow hover:shadow-indigo-500/10 transition-all cursor-pointer"
                  >
                    {sendingId === camp.id ? 'Broadcasting...' : 'Simulate Send 🚀'}
                  </button>
                ) : (
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                    ✓ Campaign Sent
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 text-sm bg-slate-900/10 border border-slate-900 rounded-2xl">
          No campaign templates configured yet.
        </div>
      )}

      {/* Add Campaign Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100 font-semibold">Draft Campaign Template</h2>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                ✨ {aiGenerating ? 'Writing...' : 'AI Generate'}
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Internal Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    placeholder="e.g. Q3 Investor Promo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Segment</label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="ALL_LEADS">All Leads</option>
                    <option value="NEW_LEADS">New Leads</option>
                    <option value="QUALIFIED_LEADS">Qualified Leads</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Subject Line</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="e.g. Exclusive New Plots Launched in Faisal Town!"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Template Message Body</label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm h-32"
                  placeholder="Dear Buyer, we are excited to share..."
                  required
                />
              </div>

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
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
