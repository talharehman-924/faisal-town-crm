'use client';

import { useState, useEffect } from 'react';

export default function BuyersPage() {
  const [buyers, setBuyers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Modals state
  const [isPrefOpen, setIsPrefOpen] = useState(false);
  const [isMatchOpen, setIsMatchOpen] = useState(false);
  const [activeBuyer, setActiveBuyer] = useState(null);

  // Preference Form state
  const [formMinBudget, setFormMinBudget] = useState('');
  const [formMaxBudget, setFormMaxBudget] = useState('');
  const [formPreferredType, setFormPreferredType] = useState('RESIDENTIAL');
  const [formPreferredLocation, setFormPreferredLocation] = useState('');
  const [error, setError] = useState('');

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/buyers');
      if (res.ok) {
        const data = await res.json();
        setBuyers(data.buyers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  const handleEditPrefClick = (buyer) => {
    setActiveBuyer(buyer);
    const pref = buyer.buyerPreference;
    if (pref) {
      setFormMinBudget(pref.minBudget);
      setFormMaxBudget(pref.maxBudget);
      setFormPreferredType(pref.preferredType);
      setFormPreferredLocation(pref.preferredLocation || '');
    } else {
      setFormMinBudget('');
      setFormMaxBudget('');
      setFormPreferredType('RESIDENTIAL');
      setFormPreferredLocation('');
    }
    setError('');
    setIsPrefOpen(true);
  };

  const handlePrefSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (parseFloat(formMinBudget) > parseFloat(formMaxBudget)) {
      setError('Minimum budget cannot exceed maximum budget.');
      return;
    }

    try {
      const res = await fetch('/api/buyers/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: activeBuyer.id,
          minBudget: parseFloat(formMinBudget),
          maxBudget: parseFloat(formMaxBudget),
          preferredType: formPreferredType,
          preferredLocation: formPreferredLocation,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save preferences');
      }

      setIsPrefOpen(false);
      setActiveBuyer(null);
      fetchBuyers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMatchClick = async (buyer) => {
    setActiveBuyer(buyer);
    setIsMatchOpen(true);
    setMatchingLoading(true);
    try {
      const res = await fetch(`/api/buyers/match/${buyer.id}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error(err);
      setMatches([]);
    } finally {
      setMatchingLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Buyer Management</h1>
        <p className="text-slate-400 text-sm mt-1">Track buyer preference criteria and match them automatically with active property listings</p>
      </div>

      {/* Buyers List */}
      <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
        {loading ? (
          <div className="py-20 flex items-center justify-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            Loading Buyers...
          </div>
        ) : buyers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-450 bg-slate-900/10">
                  <th className="py-4 px-6 font-semibold">Buyer Name</th>
                  <th className="py-4 px-6 font-semibold">Assigned Agent</th>
                  <th className="py-4 px-6 font-semibold">Budget Range</th>
                  <th className="py-4 px-6 font-semibold text-center">Location Interest</th>
                  <th className="py-4 px-6 font-semibold text-center">Type Interest</th>
                  <th className="py-4 px-6 font-semibold text-right">Matching listings</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((buyer) => {
                  const pref = buyer.buyerPreference;
                  return (
                    <tr key={buyer.id} className="border-b border-slate-850/60 hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-100">{buyer.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-mono">{buyer.email}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">
                        {buyer.agent?.name || <span className="italic text-slate-650">Unassigned</span>}
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        {pref ? (
                          <span className="text-cyan-400">
                            {formatCurrency(pref.minBudget)} - {formatCurrency(pref.maxBudget)}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-xs">Not configured</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-semibold text-slate-400">
                        {pref?.preferredLocation || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-4 px-6 text-center text-xs text-slate-300 font-bold">
                        {pref?.preferredType || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleEditPrefClick(buyer)}
                            className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer"
                          >
                            {pref ? 'Update Prefs' : 'Set Prefs'}
                          </button>
                          <button
                            onClick={() => handleMatchClick(buyer)}
                            disabled={!pref}
                            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                              pref 
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-transparent'
                                : 'bg-slate-900 text-slate-600 border-slate-900 cursor-not-allowed'
                            }`}
                          >
                            Find Matches 🔍
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 text-sm">
            No active buyers to manage.
          </div>
        )}
      </div>

      {/* Edit Preference Modal */}
      {isPrefOpen && activeBuyer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-3">
              Configure Search Preferences: {activeBuyer.name}
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handlePrefSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Budget (PKR)</label>
                  <input
                    type="number"
                    value={formMinBudget}
                    onChange={(e) => setFormMinBudget(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Budget (PKR)</label>
                  <input
                    type="number"
                    value={formMaxBudget}
                    onChange={(e) => setFormMaxBudget(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preferred Type</label>
                  <select
                    value={formPreferredType}
                    onChange={(e) => setFormPreferredType(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preferred Location</label>
                  <input
                    type="text"
                    value={formPreferredLocation}
                    onChange={(e) => setFormPreferredLocation(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    placeholder="e.g. Block B, Executive"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsPrefOpen(false);
                    setActiveBuyer(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Matches Drawer Overlay */}
      {isMatchOpen && activeBuyer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-slide-in">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Property Matches Engine</h2>
                  <p className="text-xs text-slate-500 mt-1">Automatic match results for buyer: <span className="text-slate-300 font-bold">{activeBuyer.name}</span></p>
                </div>
                <button
                  onClick={() => {
                    setIsMatchOpen(false);
                    setActiveBuyer(null);
                    setMatches([]);
                  }}
                  className="text-slate-400 hover:text-white text-lg focus:outline-none"
                >
                  ✕ Close
                </button>
              </div>

              {/* Preferences Summary */}
              {activeBuyer.buyerPreference && (
                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-500">Budget Range</span>
                    <span className="font-bold text-cyan-400 mt-0.5 block">
                      {formatCurrency(activeBuyer.buyerPreference.minBudget)} - {formatCurrency(activeBuyer.buyerPreference.maxBudget)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Category Type</span>
                    <span className="font-bold text-slate-350 mt-0.5 block">{activeBuyer.buyerPreference.preferredType}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Location Focus</span>
                    <span className="font-bold text-slate-350 mt-0.5 block">{activeBuyer.buyerPreference.preferredLocation || 'Anywhere'}</span>
                  </div>
                </div>
              )}

              {/* Matches Content */}
              {matchingLoading ? (
                <div className="py-20 text-center text-slate-400 text-sm">
                  <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Querying database listings...
                </div>
              ) : matches.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Matches ({matches.length})</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matches.map((match) => (
                      <div key={match.id} className="bg-slate-955 border border-slate-850 rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-violet-500/35 transition-colors">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold bg-slate-900 px-2 py-0.5 border border-slate-850 rounded text-slate-400 uppercase tracking-wider">{match.type}</span>
                            <span className="text-xs font-black text-emerald-400">{formatCurrency(match.price)}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 mt-3">{match.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center">📍 {match.address}</p>
                        </div>
                        
                        <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mt-1">
                          {match.description || <span className="italic text-slate-600">No description available.</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No available property listings currently match this buyer's preferences.
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-850 mt-8 flex justify-end">
              <button
                onClick={() => {
                  setIsMatchOpen(false);
                  setActiveBuyer(null);
                  setMatches([]);
                }}
                className="bg-slate-850 hover:bg-slate-750 text-slate-300 font-semibold px-5 py-2 rounded-lg text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
