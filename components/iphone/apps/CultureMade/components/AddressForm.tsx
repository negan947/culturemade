'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_COUNTRY_CODES, buildCountryNameMaps } from '@/lib/utils/countries';

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

const postalCodeValidators: Record<string, RegExp> = {
  US: /^\d{5}(-\d{4})?$/,
  CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  GB: /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[ABD-HJLNP-UW-Z]{2})$/i,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
};

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
}).superRefine((val, ctx) => {
  const re = postalCodeValidators[val.country_code];
  if (re && !re.test(val.postal_code)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['postal_code'],
      message: 'Invalid postal/ZIP code for selected country',
    });
  }
});

export function validateAddress(value: AddressFields) {
  const parsed = addressSchema.safeParse(value);
  return parsed;
}

const { codeToName: DEFAULT_CODE_TO_NAME, nameToCode: DEFAULT_NAME_TO_CODE } = buildCountryNameMaps();

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

  const sectionToken = useMemo(() => `section-${addressType}`, [addressType]);
  const postalInputMode = useMemo(() => {
    const numericCountries = new Set(['US', 'DE', 'FR', 'AU']);
    return numericCountries.has((value.country_code || '').toUpperCase()) ? 'numeric' : 'text';
  }, [value.country_code]);

  // Country autosuggest state
  const [countryQuery, setCountryQuery] = useState<string>('');
  const [isCountryFocused, setIsCountryFocused] = useState<boolean>(false);
  const { codeToName, nameToCode } = useMemo(() => buildCountryNameMaps(), []);
  const countryInputRef = useRef<HTMLInputElement | null>(null);

  const countryDisplayName = useMemo(() => {
    const code = (value.country_code || '').toUpperCase();
    return codeToName[code] || DEFAULT_CODE_TO_NAME[code] || code;
  }, [value.country_code, codeToName]);

  // Keep input text in sync with selected country when not actively editing
  useEffect(() => {
    if (!isCountryFocused) {
      setCountryQuery(countryDisplayName);
    }
  }, [countryDisplayName, isCountryFocused]);

  // No custom suggestion overlay; rely on native datalist for stability with Chrome Autofill

  // Best-effort sync shortly after mount in case Chrome applies autofill immediately
  useEffect(() => {
    const fieldIds: Array<[keyof AddressFields, string]> = [
      ['first_name', `${addressType}-given-name`],
      ['last_name', `${addressType}-family-name`],
      ['company', `${addressType}-organization`],
      ['address_line_1', `${addressType}-address-line1`],
      ['address_line_2', `${addressType}-address-line2`],
      ['city', `${addressType}-address-level2`],
      ['state_province', `${addressType}-address-level1`],
      ['postal_code', `${addressType}-postal-code`],
      // Prefer hidden code field if browser fills it
      ['country_code', `${addressType}-country-code`],
      ['country_code', `${addressType}-country`],
      ['phone', `${addressType}-tel`],
    ];

    // Delay to allow autofill to populate DOM values
    const syncTimer = window.setTimeout(() => {
      let didChange = false;
      const next: AddressFields = { ...value };
      const setNextField = <K extends keyof AddressFields>(k: K, v: AddressFields[K]) => {
        (next as any)[k] = v;
      };
      let newCountryCode: string | null = null;
      for (const [key, id] of fieldIds) {
        const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
        if (!el) continue;
        const domValue = (el as HTMLInputElement).value ?? '';
        const currentValue = (value[key] ?? '') as string;
        if (typeof domValue === 'string' && domValue !== currentValue) {
          // Normalize nullable fields
          if (key === 'country_code') {
            const trimmed = domValue.trim();
          const code = trimmed.length === 2
            ? trimmed.toUpperCase()
            : (nameToCode[trimmed.toUpperCase()] || DEFAULT_NAME_TO_CODE[trimmed.toUpperCase()] || currentValue);
            setNextField('country_code', code as any);
            newCountryCode = code;
          } else {
            if (key === 'company' || key === 'address_line_2' || key === 'phone') {
              setNextField(key as 'company' | 'address_line_2' | 'phone', (domValue || null) as any);
            } else {
              setNextField(key as Exclude<keyof AddressFields, 'company' | 'address_line_2' | 'phone'>, domValue as any);
            }
          }
          didChange = true;
        }
      }
      if (didChange) {
        const nextValid = validateAddress(next).success;
        onChange(next, nextValid);
        if (!isCountryFocused && newCountryCode) {
          const n = newCountryCode.toUpperCase();
          const display = codeToName[n] || DEFAULT_CODE_TO_NAME[n] || n;
          setCountryQuery(display);
        }
      }
    }, 150);

    return () => window.clearTimeout(syncTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressType]);

  // Listen for WebKit autofill via CSS animationstart and sync that specific field
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    const onAnimStart = (evt: AnimationEvent) => {
      if (evt.animationName !== 'cm-autofill-start') return;
      const target = evt.target as HTMLInputElement | HTMLSelectElement | null;
      if (!target || !('name' in target)) return;
      const name = target.name;
      const val = (target as HTMLInputElement).value ?? '';
      switch (name) {
        case 'given-name':
          if (val !== value.first_name) updateField('first_name', val);
          break;
        case 'family-name':
          if (val !== value.last_name) updateField('last_name', val);
          break;
        case 'organization':
          if ((val || null) !== (value.company ?? null)) updateField('company', (val || null) as any);
          break;
        case 'address-line1':
          if (val !== value.address_line_1) updateField('address_line_1', val);
          break;
        case 'address-line2':
          if ((val || null) !== (value.address_line_2 ?? null)) updateField('address_line_2', (val || null) as any);
          break;
        case 'address-level2':
          if (val !== value.city) updateField('city', val);
          break;
        case 'address-level1':
          if (val !== value.state_province) updateField('state_province', val);
          break;
        case 'postal-code':
          if (val !== value.postal_code) updateField('postal_code', val);
          break;
        case 'country':
        case 'country-name': {
          const trimmed = val.trim();
          const code = trimmed.length === 2
            ? trimmed.toUpperCase()
            : (nameToCode[trimmed.toUpperCase()] || DEFAULT_NAME_TO_CODE[trimmed.toUpperCase()] || (value.country_code || '').toUpperCase());
          if (code !== (value.country_code || '').toUpperCase()) updateField('country_code', code as any);
          if (!isCountryFocused) {
            const display = codeToName[code] || DEFAULT_CODE_TO_NAME[code] || code;
            setCountryQuery(display);
          }
          break;
        }
        case 'tel':
          if ((val || null) !== (value.phone ?? null)) updateField('phone', (val || null) as any);
          break;
        default:
          break;
      }
    };
    rootEl.addEventListener('animationstart', onAnimStart as any, true);
    return () => rootEl.removeEventListener('animationstart', onAnimStart as any, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, addressType]);

  const getError = (field: keyof AddressFields) => {
    if (!touched[field]) return '';
    if (validation.success) return '';
    const issue = validation.error.issues.find((i) => i.path[0] === field);
    return issue ? String(issue.message) : '';
  };

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${addressType}-given-name`} className="block text-xs text-gray-600 mb-1">First name</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('first_name') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.first_name}
            onChange={(e) => updateField('first_name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, first_name: true }))}
            disabled={disabled}
            placeholder="John"
            id={`${addressType}-given-name`}
            name="given-name"
            autoComplete={`${sectionToken} ${addressType} given-name`}
            autoCapitalize="words"
            spellCheck={false}
          />
          {getError('first_name') && <p className="mt-1 text-xs text-red-600">{getError('first_name')}</p>}
        </div>
        <div>
          <label htmlFor={`${addressType}-family-name`} className="block text-xs text-gray-600 mb-1">Last name</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('last_name') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.last_name}
            onChange={(e) => updateField('last_name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, last_name: true }))}
            disabled={disabled}
            placeholder="Doe"
            id={`${addressType}-family-name`}
            name="family-name"
            autoComplete={`${sectionToken} ${addressType} family-name`}
            autoCapitalize="words"
            spellCheck={false}
          />
          {getError('last_name') && <p className="mt-1 text-xs text-red-600">{getError('last_name')}</p>}
        </div>
      </div>

      <div>
        <label htmlFor={`${addressType}-organization`} className="block text-xs text-gray-600 mb-1">Company (optional)</label>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('company') ? 'border-red-500' : 'border-gray-300'}`}
          value={value.company ?? ''}
            onChange={(e) => updateField('company', (e.target.value || null) as any)}
          onBlur={() => setTouched((t) => ({ ...t, company: true as any }))}
          disabled={disabled}
          placeholder="Company"
          id={`${addressType}-organization`}
          name="organization"
          autoComplete={`${sectionToken} ${addressType} organization`}
          spellCheck={false}
        />
        {getError('company') && <p className="mt-1 text-xs text-red-600">{getError('company')}</p>}
      </div>

      <div>
        <label htmlFor={`${addressType}-address-line1`} className="block text-xs text-gray-600 mb-1">Address line 1</label>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('address_line_1') ? 'border-red-500' : 'border-gray-300'}`}
          value={value.address_line_1}
            onChange={(e) => updateField('address_line_1', e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, address_line_1: true }))}
          disabled={disabled}
          placeholder="123 Main St"
          id={`${addressType}-address-line1`}
          name="address-line1"
          autoComplete={`${sectionToken} ${addressType} address-line1`}
          spellCheck={false}
        />
        {getError('address_line_1') && <p className="mt-1 text-xs text-red-600">{getError('address_line_1')}</p>}
      </div>

      <div>
        <label htmlFor={`${addressType}-address-line2`} className="block text-xs text-gray-600 mb-1">Address line 2 (optional)</label>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('address_line_2') ? 'border-red-500' : 'border-gray-300'}`}
          value={value.address_line_2 ?? ''}
            onChange={(e) => updateField('address_line_2', (e.target.value || null) as any)}
          onBlur={() => setTouched((t) => ({ ...t, address_line_2: true as any }))}
          disabled={disabled}
          placeholder="Apt, suite, etc."
          id={`${addressType}-address-line2`}
          name="address-line2"
          autoComplete={`${sectionToken} ${addressType} address-line2`}
          spellCheck={false}
        />
        {getError('address_line_2') && <p className="mt-1 text-xs text-red-600">{getError('address_line_2')}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label htmlFor={`${addressType}-address-level2`} className="block text-xs text-gray-600 mb-1">City</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('city') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.city}
            onChange={(e) => updateField('city', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, city: true }))}
            disabled={disabled}
            placeholder="City"
            id={`${addressType}-address-level2`}
            name="address-level2"
            autoComplete={`${sectionToken} ${addressType} address-level2`}
            spellCheck={false}
          />
          {getError('city') && <p className="mt-1 text-xs text-red-600">{getError('city')}</p>}
        </div>
        <div>
          <label htmlFor={`${addressType}-address-level1`} className="block text-xs text-gray-600 mb-1">State/Province</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('state_province') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.state_province}
            onChange={(e) => updateField('state_province', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, state_province: true }))}
            disabled={disabled}
            placeholder="State/Province"
            id={`${addressType}-address-level1`}
            name="address-level1"
            autoComplete={`${sectionToken} ${addressType} address-level1`}
            spellCheck={false}
          />
          {getError('state_province') && <p className="mt-1 text-xs text-red-600">{getError('state_province')}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`${addressType}-postal-code`} className="block text-xs text-gray-600 mb-1">Postal code</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('postal_code') ? 'border-red-500' : 'border-gray-300'}`}
            value={value.postal_code}
            onChange={(e) => updateField('postal_code', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, postal_code: true }))}
            disabled={disabled}
            placeholder="ZIP/Postal code"
            id={`${addressType}-postal-code`}
            name="postal-code"
            autoComplete={`${sectionToken} ${addressType} postal-code`}
            inputMode={postalInputMode as any}
            spellCheck={false}
          />
          {getError('postal_code') && <p className="mt-1 text-xs text-red-600">{getError('postal_code')}</p>}
        </div>
        <div className="col-span-2">
          <label htmlFor={`${addressType}-country`} className="block text-xs text-gray-600 mb-1">Country</label>
          {/* Hidden ISO code input to allow Chrome to autofill the 2-letter country code */}
          <input
            type="text"
            id={`${addressType}-country-code`}
            name="country"
            autoComplete={`${sectionToken} ${addressType} country`}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            value={(value.country_code || '').toUpperCase()}
            onChange={() => {}}
            readOnly
          />
          <input
            ref={countryInputRef}
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 ${getError('country_code') ? 'border-red-500' : 'border-gray-300'}`}
            id={`${addressType}-country`}
            name="country-name"
            placeholder="Country"
            disabled={disabled}
            value={countryQuery}
            onFocus={() => {
              setIsCountryFocused(true);
            }}
            onBlur={() => {
              // Attempt to map typed query to a country code on blur
              const q = countryQuery.trim();
              if (q) {
                const upper = q.toUpperCase();
                let nextCode: string | undefined;
                if (upper.length === 2 && ALL_COUNTRY_CODES.includes(upper)) {
                  nextCode = upper;
                } else {
                  nextCode = nameToCode[upper] || DEFAULT_NAME_TO_CODE[upper];
                }
                if (nextCode && nextCode !== (value.country_code || '').toUpperCase()) {
                  updateField('country_code', nextCode as any);
                  const display = codeToName[nextCode] || DEFAULT_CODE_TO_NAME[nextCode] || nextCode;
                  setCountryQuery(display);
                } else if (!nextCode) {
                  // Revert to canonical display name
                  setCountryQuery(countryDisplayName);
                }
              }
              setIsCountryFocused(false);
              setTouched((t) => ({ ...t, country_code: true }));
            }}
            onChange={(e) => {
              setCountryQuery(e.target.value);
            }}
            autoComplete={`${sectionToken} ${addressType} country-name`}
            list={`${addressType}-country-list`}
            aria-label="Country"
            title="Country"
            spellCheck={false}
          />
          <datalist id={`${addressType}-country-list`}>
            {ALL_COUNTRY_CODES.map((code) => {
              const name = codeToName[code] || DEFAULT_CODE_TO_NAME[code] || code;
              return <option key={code} value={name} />;
            })}
          </datalist>
          {getError('country_code') && <p className="mt-1 text-xs text-red-600">{getError('country_code')}</p>}
        </div>
      </div>

      <div>
        <label htmlFor={`${addressType}-tel`} className="block text-xs text-gray-600 mb-1">Phone (optional)</label>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 ${getError('phone') ? 'border-red-500' : 'border-gray-300'}`}
          value={value.phone ?? ''}
            onChange={(e) => updateField('phone', (e.target.value || null) as any)}
          onBlur={() => setTouched((t) => ({ ...t, phone: true as any }))}
          disabled={disabled}
          placeholder="+15551234567"
          id={`${addressType}-tel`}
          name="tel"
          autoComplete={`${sectionToken} ${addressType} tel`}
          inputMode="tel"
        />
        {getError('phone') && <p className="mt-1 text-xs text-red-600">{getError('phone')}</p>}
      </div>
    </div>
  );
}


