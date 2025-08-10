'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { z } from '@/lib/validations';

export type AddressType = 'billing' | 'shipping';

export interface AddressFields {
  first_name: string;
  last_name: string;
  company?: string | null;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string; // ISO 3166-1 alpha-2
  phone?: string | null;
}

export interface AddressFormProps {
  addressType: AddressType;
  value: AddressFields;
  onChange: (value: AddressFields, isValid: boolean) => void;
  disabled?: boolean;
}

// Mirrors server-side schema in app/api/checkout/address/route.ts
const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'Country code must be ISO 3166-1 alpha-2');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[1-9]\d{1,14}$/,
    'Enter a valid phone (E.164, e.g. +15551234567)'
  )
  .optional()
  .nullable();

const addressSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(50),
  last_name: z.string().trim().min(1, 'Last name is required').max(50),
  company: z.string().trim().max(100).optional().nullable(),
  address_line_1: z.string().trim().min(3, 'Address is too short').max(120),
  address_line_2: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(80),
  state_province: z.string().trim().min(2, 'State/Province is required').max(80),
  postal_code: z.string().trim().min(3, 'Postal code is required').max(20),
  country_code: countryCodeSchema,
  phone: phoneSchema,
});

export function validateAddress(value: AddressFields) {
  const parsed = addressSchema.safeParse(value);
  return parsed;
}

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
];

export default function AddressForm({ addressType, value, onChange, disabled }: AddressFormProps) {
  const [touched, setTouched] = useState<Record<keyof AddressFields, boolean>>({
    first_name: false,
    last_name: false,
    company: false as any,
    address_line_1: false,
    address_line_2: false as any,
    city: false,
    state_province: false,
    postal_code: false,
    country_code: false,
    phone: false as any,
  });

  const validation = useMemo(() => validateAddress(value), [value]);
  const isValid = validation.success;

  const updateField = <K extends keyof AddressFields>(key: K, newValue: AddressFields[K]) => {
    const next: AddressFields = { ...value, [key]: newValue } as AddressFields;
    const nextValid = validateAddress(next).success;
    onChange(next, nextValid);
  };

  const getError = (field: keyof AddressFields) => {
    if (!touched[field]) return '';
    if (validation.success) return '';
    const issue = validation.error.issues.find((i) => i.path[0] === field);
    return issue ? String(issue.message) : '';
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">First name</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('first_name') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.first_name}
            onChange={(e) => updateField('first_name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, first_name: true }))}
            disabled={disabled}
            placeholder="John"
            autoComplete={`${addressType}-given-name`}
          />
          {getError('first_name') && <p className="mt-1 text-xs text-red-600">{getError('first_name')}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Last name</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('last_name') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.last_name}
            onChange={(e) => updateField('last_name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, last_name: true }))}
            disabled={disabled}
            placeholder="Doe"
            autoComplete={`${addressType}-family-name`}
          />
          {getError('last_name') && <p className="mt-1 text-xs text-red-600">{getError('last_name')}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Company (optional)</label>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('company') ? 'border-red-500' : 'border-gray-300'}`}
          value={value.company ?? ''}
          onChange={(e) => updateField('company', (e.target.value || null) as any)}
          onBlur={() => setTouched((t) => ({ ...t, company: true as any }))}
          disabled={disabled}
          placeholder="Company"
          autoComplete={`${addressType}-organization`}
        />
        {getError('company') && <p className="mt-1 text-xs text-red-600">{getError('company')}</p>}
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Address line 1</label>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('address_line_1') ? 'border-red-500' : 'border-gray-300'}`}
          value={value.address_line_1}
          onChange={(e) => updateField('address_line_1', e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, address_line_1: true }))}
          disabled={disabled}
          placeholder="123 Main St"
          autoComplete={`${addressType}-address-line1`}
        />
        {getError('address_line_1') && <p className="mt-1 text-xs text-red-600">{getError('address_line_1')}</p>}
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Address line 2 (optional)</label>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('address_line_2') ? 'border-red-500' : 'border-gray-300'}`}
          value={value.address_line_2 ?? ''}
          onChange={(e) => updateField('address_line_2', (e.target.value || null) as any)}
          onBlur={() => setTouched((t) => ({ ...t, address_line_2: true as any }))}
          disabled={disabled}
          placeholder="Apt, suite, etc."
          autoComplete={`${addressType}-address-line2`}
        />
        {getError('address_line_2') && <p className="mt-1 text-xs text-red-600">{getError('address_line_2')}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">City</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('city') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.city}
            onChange={(e) => updateField('city', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, city: true }))}
            disabled={disabled}
            placeholder="City"
            autoComplete={`${addressType}-address-level2`}
          />
          {getError('city') && <p className="mt-1 text-xs text-red-600">{getError('city')}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">State/Province</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('state_province') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.state_province}
            onChange={(e) => updateField('state_province', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, state_province: true }))}
            disabled={disabled}
            placeholder="State/Province"
            autoComplete={`${addressType}-address-level1`}
          />
          {getError('state_province') && <p className="mt-1 text-xs text-red-600">{getError('state_province')}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Postal code</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('postal_code') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.postal_code}
            onChange={(e) => updateField('postal_code', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, postal_code: true }))}
            disabled={disabled}
            placeholder="ZIP/Postal code"
            autoComplete={`${addressType}-postal-code`}
          />
          {getError('postal_code') && <p className="mt-1 text-xs text-red-600">{getError('postal_code')}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Country</label>
          <select
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 ${getError('country_code') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.country_code}
            onChange={(e) => updateField('country_code', e.target.value.toUpperCase() as any)}
            onBlur={() => setTouched((t) => ({ ...t, country_code: true }))}
            disabled={disabled}
            autoComplete={`${addressType}-country`}
            aria-label="Country"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          {getError('country_code') && <p className="mt-1 text-xs text-red-600">{getError('country_code')}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Phone (optional)</label>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('phone') ? 'border-red-500' : 'border-gray-300'}`}
          value={value.phone ?? ''}
          onChange={(e) => updateField('phone', (e.target.value || null) as any)}
          onBlur={() => setTouched((t) => ({ ...t, phone: true as any }))}
          disabled={disabled}
          placeholder="+15551234567"
          autoComplete={`${addressType}-tel`}
        />
        {getError('phone') && <p className="mt-1 text-xs text-red-600">{getError('phone')}</p>}
      </div>
    </div>
  );
}


