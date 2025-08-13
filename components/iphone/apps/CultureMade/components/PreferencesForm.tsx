'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PreferencesFormProps {
  onBack: () => void;
}

interface PreferencesRecord {
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_opt_in: boolean;
  size_preference: string | null;
  language: string | null;
  currency: string | null;
}

export default function PreferencesForm({ onBack }: PreferencesFormProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<PreferencesRecord | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/preferences', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load preferences');
      const json = await res.json();
      setPrefs(
        json.preferences || {
          user_id: '',
          email_notifications: true,
          sms_notifications: false,
          push_notifications: false,
          marketing_opt_in: false,
          size_preference: null,
          language: 'en',
          currency: 'USD',
        }
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_notifications: !!prefs.email_notifications,
          sms_notifications: !!prefs.sms_notifications,
          push_notifications: !!prefs.push_notifications,
          marketing_opt_in: !!prefs.marketing_opt_in,
          size_preference: prefs.size_preference || null,
          language: prefs.language || null,
          currency: prefs.currency || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      setSuccess('Saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center">
        <button onClick={onBack} className="mr-3 text-blue-600">Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
      </div>

      <div className="flex-1 overflow-y-auto culturemade-scrollable p-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-6">
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-700">{success}</div>}

            {/* Notifications */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Notifications</h3>
              <div className="space-y-3 text-sm">
                <label className="flex items-center justify-between">
                  <span>Email notifications</span>
                  <input
                    type="checkbox"
                    checked={!!prefs?.email_notifications}
                    onChange={(e) => setPrefs((p) => (p ? { ...p, email_notifications: e.target.checked } : p))}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>SMS notifications</span>
                  <input
                    type="checkbox"
                    checked={!!prefs?.sms_notifications}
                    onChange={(e) => setPrefs((p) => (p ? { ...p, sms_notifications: e.target.checked } : p))}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>Push notifications</span>
                  <input
                    type="checkbox"
                    checked={!!prefs?.push_notifications}
                    onChange={(e) => setPrefs((p) => (p ? { ...p, push_notifications: e.target.checked } : p))}
                  />
                </label>
              </div>
            </div>

            {/* Marketing */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Marketing</h3>
              <label className="flex items-center justify-between text-sm">
                <span>Receive offers and updates</span>
                <input
                  type="checkbox"
                  checked={!!prefs?.marketing_opt_in}
                  onChange={(e) => setPrefs((p) => (p ? { ...p, marketing_opt_in: e.target.checked } : p))}
                />
              </label>
            </div>

            {/* Size & Locale */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Personalization</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">Size</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 border-gray-300"
                    placeholder="M"
                    value={prefs?.size_preference || ''}
                    onChange={(e) => setPrefs((p) => (p ? { ...p, size_preference: e.target.value || null } : p))}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">Language</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 border-gray-300"
                    placeholder="en"
                    value={prefs?.language || ''}
                    onChange={(e) => setPrefs((p) => (p ? { ...p, language: e.target.value || null } : p))}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">Currency</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 border-gray-300"
                    placeholder="USD"
                    value={prefs?.currency || ''}
                    onChange={(e) => setPrefs((p) => (p ? { ...p, currency: e.target.value || null } : p))}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={onBack} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white">Back</button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={save}
                disabled={saving}
                className={`px-4 py-2 rounded-lg font-medium ${saving ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white'}`}
              >
                {saving ? 'Saving…' : 'Save'}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


