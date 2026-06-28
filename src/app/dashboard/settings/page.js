'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // System settings state
  const [brandingName, setBrandingName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  const [systemError, setSystemError] = useState('');
  
  // Profile settings state
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirm, setProfileConfirm] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setProfileName(data.user.name || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setBrandingName(data.settings.brandingName || '');
        setCurrencySymbol(data.settings.currencySymbol || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSettings();
  }, []);

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setSystemMessage('');
    setSystemError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandingName, currencySymbol }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update system settings');
      }

      setSystemMessage('System configurations updated successfully. Refresh to apply brand changes!');
      fetchSettings();
    } catch (err) {
      setSystemError(err.message);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');

    if (profilePassword && profilePassword !== profileConfirm) {
      setProfileError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          password: profilePassword || undefined
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileMessage('User profile updated successfully.');
      setProfilePassword('');
      setProfileConfirm('');
      fetchProfile();
    } catch (err) {
      setProfileError(err.message);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure CRM branding, view variables, and update user credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-6 shadow-lg">
          <div>
            <h3 className="font-extrabold text-slate-200 text-base">User Profile Update</h3>
            <p className="text-xs text-slate-500 mt-1">Update your login profile details</p>
          </div>

          {profileMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-semibold">
              {profileMessage}
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="text"
                value={currentUser?.email || ''}
                className="w-full bg-slate-950/20 border border-slate-900 rounded-lg px-3 py-2 text-slate-550 text-sm cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password (Optional)</label>
              <input
                type="password"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                placeholder="Leave blank to keep current"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
              <input
                type="password"
                value={profileConfirm}
                onChange={(e) => setProfileConfirm(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                placeholder="Confirm password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2 rounded-lg text-sm transition-all cursor-pointer"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>

        {/* System Settings (Admin only) */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-6 shadow-lg">
          <div>
            <h3 className="font-extrabold text-slate-200 text-base">Branding & System Configuration</h3>
            <p className="text-xs text-slate-500 mt-1">Configure parameters (Admin Only)</p>
          </div>

          {systemMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-semibold">
              {systemMessage}
            </div>
          )}

          {systemError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
              {systemError}
            </div>
          )}

          {currentUser?.role === 'ADMIN' ? (
            <form onSubmit={handleSystemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">CRM Branding Name</label>
                <input
                  type="text"
                  value={brandingName}
                  onChange={(e) => setBrandingName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2 rounded-lg text-sm transition-all cursor-pointer"
                >
                  Save System Config
                </button>
              </div>
            </form>
          ) : (
            <div className="py-20 text-center text-slate-600 text-xs italic bg-slate-950/15 border border-slate-900/40 rounded-xl">
              Access Restricted. Only administrators can update system-level variables.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
