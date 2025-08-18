'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import AddressForm, { type AddressFields } from './AddressForm';

type AddressType = 'billing' | 'shipping' | 'both';

interface AddressRecord extends AddressFields {
  id: string;
  user_id: string | null;
  type: AddressType;
  is_default: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AddressListProps {
  onBack: () => void;
}

export default function AddressList({ onBack }: AddressListProps) {
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editing, setEditing] = useState<AddressRecord | null>(null);
  const [addressType, setAddressType] = useState<AddressType>('shipping');
  const [isDefaultForType, setIsDefaultForType] = useState<boolean>(false);
  const [formValue, setFormValue] = useState<AddressFields>({
    first_name: '',
    last_name: '',
    company: null,
    address_line_1: '',
    address_line_2: null,
    city: '',
    state_province: '',
    postal_code: '',
    country_code: 'US',
    phone: null,
  });
  const [formValid, setFormValid] = useState<boolean>(false);
  const isEditing = useMemo(() => !!editing, [editing]);

  async function loadAddresses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/addresses', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load addresses');
      const json = await res.json();
      setAddresses(Array.isArray(json.addresses) ? json.addresses : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  const resetEditor = () => {
    setEditing(null);
    setAddressType('shipping');
    setIsDefaultForType(false);
    setFormValue({
      first_name: '',
      last_name: '',
      company: null,
      address_line_1: '',
      address_line_2: null,
      city: '',
      state_province: '',
      postal_code: '',
      country_code: 'US',
      phone: null,
    });
    setFormValid(false);
  };

  const openCreate = () => {
    resetEditor();
    setShowEditor(true);
  };

  const openEdit = (addr: AddressRecord) => {
    setEditing(addr);
    setAddressType(addr.type);
    setIsDefaultForType(!!addr.is_default);
    setFormValue({
      first_name: addr.first_name,
      last_name: addr.last_name,
      company: addr.company ?? null,
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 ?? null,
      city: addr.city,
      state_province: addr.state_province,
      postal_code: addr.postal_code,
      country_code: (addr.country_code || 'US').toUpperCase(),
      phone: addr.phone ?? null,
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    resetEditor();
  };

  async function handleDelete(id: string) {
    if (!confirm('Delete this address?')) return;
    try {
      const res = await fetch(`/api/profile/addresses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete address');
      await loadAddresses();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete address');
    }
  }

  async function handleSetDefault(addr: AddressRecord) {
    try {
      const res = await fetch(`/api/profile/addresses/${addr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true, type: addr.type }),
      });
      if (!res.ok) throw new Error('Failed to set default');
      await loadAddresses();
    } catch (e: any) {
      alert(e?.message || 'Failed to set default');
    }
  }

  async function handleSubmit() {
    try {
      if (!formValid) return;
      if (isEditing && editing) {
        const res = await fetch(`/api/profile/addresses/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formValue,
            type: addressType,
            is_default: isDefaultForType,
          }),
        });
        if (!res.ok) throw new Error('Failed to update address');
      } else {
        const res = await fetch('/api/profile/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formValue,
            type: addressType,
            is_default: isDefaultForType,
          }),
        });
        if (!res.ok) throw new Error('Failed to save address');
      }
      closeEditor();
      await loadAddresses();
    } catch (e: any) {
      alert(e?.message || 'Failed to save address');
    }
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center">
        <button onClick={onBack} className="mr-3 text-admin-accent">Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
      </div>

      {!showEditor && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={openCreate}
            className="w-full bg-admin-accent text-white py-3 rounded-lg font-medium"
          >
            Add New Address
          </motion.button>
        </div>
      )}

      {/* List */}
      {!showEditor && (
        <div className="flex-1 overflow-y-auto culturemade-scrollable p-4 space-y-3">
          {loading && <div className="text-sm text-gray-500">Loading addresses…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && addresses.length === 0 && (
            <div className="text-sm text-gray-500">No saved addresses yet.</div>
          )}
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="text-sm text-gray-900">
                  <div className="font-medium mb-1">
                    {addr.first_name} {addr.last_name}
                    <span className="ml-2 text-xs text-gray-500 uppercase">[{addr.type}]</span>
                    {addr.is_default ? (
                      <span className="ml-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Default</span>
                    ) : null}
                  </div>
                  <div>{addr.address_line_1}</div>
                  {addr.address_line_2 && <div>{addr.address_line_2}</div>}
                  <div>{addr.city}, {addr.state_province} {addr.postal_code}</div>
                  <div>{addr.country_code}</div>
                  {addr.phone && <div className="text-gray-600">{addr.phone}</div>}
                </div>
                <div className="space-x-2">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      className="text-xs bg-green-600 text-white rounded px-2 py-1"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    className="text-xs bg-gray-100 text-gray-900 rounded px-2 py-1 border border-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs bg-red-50 text-red-600 rounded px-2 py-1 border border-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {showEditor && (
        <div className="flex-1 overflow-y-auto culturemade-scrollable p-4 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Address Type</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 border-gray-300"
                  value={addressType}
                  onChange={(e) => setAddressType(e.target.value as AddressType)}
                  aria-label="Address type"
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isDefaultForType}
                    onChange={(e) => setIsDefaultForType(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as default</span>
                </label>
              </div>
            </div>

            <AddressForm
              addressType={addressType === 'billing' ? 'billing' : 'shipping'}
              value={formValue}
              onChange={(v, ok) => {
                setFormValue(v);
                setFormValid(ok);
              }}
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={closeEditor}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!formValid}
                className={`px-4 py-2 rounded-lg font-medium ${formValid ? 'bg-admin-accent text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                {isEditing ? 'Save Changes' : 'Save Address'}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


