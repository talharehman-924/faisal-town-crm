'use client';

import { useState, useEffect } from 'react';

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState('AVAILABLE');
  const [formType, setFormType] = useState('RESIDENTIAL');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  // Fetch profile
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

  // Fetch properties list
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        type: typeFilter,
        minPrice,
        maxPrice,
      }).toString();

      const res = await fetch(`/api/properties?${query}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [search, statusFilter, typeFilter, minPrice, maxPrice]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormAddress('');
    setFormStatus('AVAILABLE');
    setFormType('RESIDENTIAL');
    setError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          price: parseFloat(formPrice),
          address: formAddress,
          status: formStatus,
          type: formType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create property');
      }

      setIsAddOpen(false);
      resetForm();
      fetchProperties();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (prop) => {
    setEditingProperty(prop);
    setFormTitle(prop.title);
    setFormDescription(prop.description || '');
    setFormPrice(prop.price);
    setFormAddress(prop.address);
    setFormStatus(prop.status);
    setFormType(prop.type);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`/api/properties/${editingProperty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          price: parseFloat(formPrice),
          address: formAddress,
          status: formStatus,
          type: formType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update property');
      }

      setIsEditOpen(false);
      setEditingProperty(null);
      resetForm();
      fetchProperties();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClick = async (propId) => {
    if (!confirm('Are you sure you want to delete this property listing?')) return;

    try {
      const res = await fetch(`/api/properties/${propId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete property');
      }
      fetchProperties();
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SOLD':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'RESIDENTIAL':
        return '🏠';
      case 'COMMERCIAL':
        return '🏢';
      case 'LAND':
        return '🌱';
      default:
        return '📍';
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Property Listings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage listings, set pricing, types, and allocation details</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer"
        >
          + Add New Listing
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              placeholder="Search properties by title, address, or description..."
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors text-sm"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="PENDING">Pending</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors text-sm"
            >
              <option value="">All Types</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="LAND">Land</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              placeholder="Min Price (PKR)"
            />
          </div>
          <div>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              placeholder="Max Price (PKR)"
            />
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="py-20 flex items-center justify-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading Properties...
        </div>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-slate-900/40 border border-slate-900 hover:border-slate-850 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Header preview */}
              <div className="bg-slate-900/80 p-6 flex justify-between items-start border-b border-slate-850 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-violet-600/5 rounded-full blur-xl group-hover:bg-violet-600/10"></div>
                <div>
                  <span className="text-2xl" title={prop.type}>{getTypeIcon(prop.type)}</span>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">{prop.type}</div>
                </div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(prop.status)}`}>
                  {prop.status}
                </span>
              </div>

              {/* Body info */}
              <div className="p-6 space-y-4 flex-1">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-violet-400 transition-colors duration-200">{prop.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    📍 {prop.address}
                  </p>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {prop.description || <span className="italic text-slate-600">No description provided.</span>}
                </p>
              </div>

              {/* Pricing & Actions */}
              <div className="bg-slate-900/20 p-6 border-t border-slate-850/80 flex items-center justify-between">
                <div className="font-extrabold text-cyan-400 text-lg">
                  {formatCurrency(prop.price)}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(prop)}
                    className="text-xs bg-slate-850 hover:bg-slate-750 text-slate-350 px-3 py-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(prop.id)}
                    className="text-xs bg-rose-500/10 hover:bg-rose-500/25 text-rose-450 px-3 py-1.5 rounded-lg border border-rose-500/10 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-555 text-sm bg-slate-900/10 rounded-2xl border border-slate-900">
          No listings found matching current filters.
        </div>
      )}

      {/* Add Property Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-fade-in">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-3">Add New Property Listing</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="e.g. 5 Marla Brand New House"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="e.g. Plot 104, Block C, Faisal Town"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Price (PKR)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    placeholder="e.g. 23000000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="PENDING">Pending</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm h-24"
                  placeholder="Provide features, double story layout, bedrooms etc..."
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
                  Save Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-3">Edit Property Details</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Price (PKR)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500 text-sm"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="PENDING">Pending</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingProperty(null);
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
