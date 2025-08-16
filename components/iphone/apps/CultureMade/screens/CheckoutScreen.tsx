'use client';

import { motion, useAnimation } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { getCartSessionId } from '@/utils/cartSync';

import AddressForm, { AddressFields, validateAddress } from '../components/AddressForm';
import PaymentForm from '../components/PaymentForm';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import OrderConfirmation from '../components/OrderConfirmation';

type StepId = 'contact' | 'shipping' | 'payment' | 'confirm';

interface CheckoutScreenProps {
  onClose: () => void;
  userId?: string;
}

interface AddressApiResponse {
  success?: boolean;
  error?: string;
  addressType?: 'billing' | 'shipping';
  address?: AddressFields;
  shipping_quote?: number;
  persisted?: { saved: boolean; address_id?: string };
}

export default function CheckoutScreen({ onClose, userId }: CheckoutScreenProps) {
  const sessionId = !userId ? getCartSessionId() : undefined;
  const [step, setStep] = useState<StepId>('contact');
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const controls = useAnimation();
  const [showSummary, setShowSummary] = useState(true);
  const [cartSummary, setCartSummary] = useState<{ items: Array<{ name: string; variant?: string | null; qty: number; price: number }>; total: number } | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const isFinalized = step === 'confirm';

  // Persist helper (write-through to both localStorage and sessionStorage)
  const persistAll = () => {
    try {
      const contactPayload = JSON.stringify({ email: contactEmail, name: contactName, phone: contactPhone });
      localStorage.setItem('cm_checkout_contact', contactPayload);
      sessionStorage.setItem('cm_checkout_contact', contactPayload);

      const shippingPayload = JSON.stringify(shipping);
      localStorage.setItem('cm_checkout_shipping', shippingPayload);
      sessionStorage.setItem('cm_checkout_shipping', shippingPayload);

      const billingPayload = JSON.stringify(billing);
      localStorage.setItem('cm_checkout_billing', billingPayload);
      sessionStorage.setItem('cm_checkout_billing', billingPayload);

      const samePayload = String(useBillingForShipping);
      localStorage.setItem('cm_checkout_use_billing_for_shipping', samePayload);
      sessionStorage.setItem('cm_checkout_use_billing_for_shipping', samePayload);
    } catch {}
  };

  // Contact step state
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactValid, setContactValid] = useState<boolean>(false);

  // Shipping entered before billing (Shopify-style)
  const [shipping, setShipping] = useState<AddressFields>({
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
  const [shippingValid, setShippingValid] = useState(false);

  const [useBillingForShipping, setUseBillingForShipping] = useState(true);
  const [billing, setBilling] = useState<AddressFields>({
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
  const [billingValid, setBillingValid] = useState(false);

  const canContinue = useMemo(() => {
    if (step === 'contact') {
      return contactValid;
    }
    if (step !== 'shipping') return true;
    // shipping first; if billing is same as shipping, only require shipping
    if (useBillingForShipping) return shippingValid;
    return shippingValid && billingValid;
  }, [step, contactValid, shippingValid, billingValid, useBillingForShipping]);

  useEffect(() => {
    setServerError(null);
  }, [step]);

  useEffect(() => {
    // Ensure we start in-place for manual exit animation control
    controls.set({ x: 0, opacity: 1 });
  }, [controls]);

  // Persist/restore checkout form state in localStorage
  useEffect(() => {
    try {
      const storedContact = localStorage.getItem('cm_checkout_contact');
      if (storedContact) {
        const parsed = JSON.parse(storedContact) as { email?: string; name?: string; phone?: string };
        setContactEmail(parsed.email || '');
        setContactName(parsed.name || '');
        setContactPhone(parsed.phone || '');
        if (parsed.email) setContactValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email));
      }

      const storedShipping = localStorage.getItem('cm_checkout_shipping');
      if (storedShipping) {
        const parsed = JSON.parse(storedShipping) as AddressFields;
        setShipping(parsed);
        setShippingValid(validateAddress(parsed).success);
      } else {
        // Hydrate from defaults in forms if present
        setShipping((prev) => ({ ...prev }));
      }

      const storedUseBilling = localStorage.getItem('cm_checkout_use_billing_for_shipping');
      if (storedUseBilling) {
        setUseBillingForShipping(storedUseBilling === 'true');
      }

      const storedBilling = localStorage.getItem('cm_checkout_billing');
      if (storedBilling) {
        const parsed = JSON.parse(storedBilling) as AddressFields;
        setBilling(parsed);
        setBillingValid(validateAddress(parsed).success);
      } else {
        setBilling((prev) => ({ ...prev }));
      }
    } catch {}
  }, []);

  // Persist on tab hide/unload as a safety net
  useEffect(() => {
    const onBeforeUnload = () => persistAll();
    const onVisibility = () => { if (document.visibilityState === 'hidden') persistAll(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [contactEmail, contactName, contactPhone, shipping, billing, useBillingForShipping]);

  useEffect(() => {
    try {
      localStorage.setItem('cm_checkout_contact', JSON.stringify({ email: contactEmail, name: contactName, phone: contactPhone }));
    } catch {}
  }, [contactEmail, contactName, contactPhone]);

  useEffect(() => {
    try {
      localStorage.setItem('cm_checkout_shipping', JSON.stringify(shipping));
    } catch {}
  }, [shipping]);

  useEffect(() => {
    try {
      localStorage.setItem('cm_checkout_use_billing_for_shipping', String(useBillingForShipping));
    } catch {}
  }, [useBillingForShipping]);

  useEffect(() => {
    try {
      localStorage.setItem('cm_checkout_billing', JSON.stringify(billing));
    } catch {}
  }, [billing]);

  // Load a lightweight cart summary for the dropdown
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(userId ? { userId } : (sessionId ? { sessionId } : {}) as Record<string, string>);
        const res = await fetch(`/api/cart?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const items = (json?.cart?.items || []).map((i: any) => ({ name: i.product_name, variant: i.variant_title || null, qty: i.quantity, price: i.total }));
        const total = Number(json?.cart?.total || 0);
        setCartSummary({ items, total });
      } catch {}
    })();
  }, [userId, sessionId]);

  const handleSubmitAddresses = async () => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      // Submit shipping first
      const shippingRes = await fetch('/api/checkout/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressType: 'shipping',
          address: shipping,
          ...(sessionId ? { sessionId } : {}),
          save: true,
          setDefault: true,
        }),
      });
      const shippingJson = (await shippingRes.json()) as AddressApiResponse;
      if (!shippingRes.ok || shippingJson.error) {
        throw new Error(shippingJson.error || 'Failed to save shipping address');
      }

      // Submit billing if not same as shipping
      if (!useBillingForShipping) {
        const billingRes = await fetch('/api/checkout/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressType: 'billing',
            address: billing,
            ...(sessionId ? { sessionId } : {}),
            save: true,
            setDefault: true,
          }),
        });
        const billingJson = (await billingRes.json()) as AddressApiResponse;
        if (!billingRes.ok || billingJson.error) {
          throw new Error(billingJson.error || 'Failed to save billing address');
        }
      }

      // Create a checkout session to lock totals and pass to payment intent
      const sessionRes = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(sessionId ? { sessionId } : {}),
          currency: 'USD',
        }),
      });
      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok || sessionJson.error || !sessionJson.session?.id) {
        throw new Error(sessionJson.error || 'Failed to create checkout session');
      }

      setCheckoutSessionId(String(sessionJson.session.id));
      setStep('payment');
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit addresses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = async () => {
    if (step === 'contact') {
      persistAll();
      await controls.start({ x: '100%', opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } });
      onClose();
      return;
    }
    if (step === 'shipping') { persistAll(); return setStep('contact'); }
    if (step === 'payment') return setStep('shipping');
    if (step === 'confirm') return; // do not allow navigating back after confirmation
  };

  // Block accidental browser back navigation via Backspace/Alt+Left on confirmation step
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (step !== 'confirm') return;
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as any).isContentEditable === true
      );
      if (!isTyping && (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
  }, [step]);

  return (
    <motion.div
      className="relative h-full w-full bg-white flex flex-col pt-[48px] pb-3"
      animate={controls}
      initial={{ x: 0, opacity: 1 }}
    >
      {/* Safe-area fillers to match header/footer color */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-safe-top bg-white" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-safe-bottom bg-white" />
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        {step !== 'contact' && step !== 'confirm' ? (
          <motion.button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Back"
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        ) : (
          <div className="w-9" />
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Checkout</h2>
          <p className="text-xs text-gray-500">
            Step {step === 'contact' ? '1' : step === 'shipping' ? '2' : step === 'payment' ? '3' : '4'} of 4
          </p>
        </div>
        {step === 'contact' ? (
          <motion.button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Close checkout"
            whileTap={{ scale: 0.95 }}
          >
            <X className="h-5 w-5" />
          </motion.button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Summary Dropdown */}
      {cartSummary && (
        <div className="bg-white border-b border-gray-200">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-sm"
            onClick={() => setShowSummary((s) => !s)}
            
          >
            <span className="text-gray-700 font-medium">Order summary</span>
            {showSummary ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </button>
          {showSummary && (
            <div className="px-4 pb-3 space-y-2">
              {cartSummary.items.slice(0, 3).map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-gray-600">
                  <div className="truncate mr-2">
                    <span className="font-medium text-gray-800">{it.name}</span>
                    {it.variant && <span className="text-gray-500"> • {it.variant}</span>}
                    <span className="text-gray-500"> ×{it.qty}</span>
                  </div>
                  <span className="text-gray-800">${it.price.toFixed(2)}</span>
                </div>
              ))}
              {cartSummary.items.length > 3 && (
                <div className="text-xs text-gray-500">+{cartSummary.items.length - 3} more item(s)</div>
              )}
              <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-gray-900">${cartSummary.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {serverError}
          </div>
        )}

        {step === 'contact' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Contact information</h3>
              <p className="text-xs text-gray-500 mb-3">We’ll send your receipt and updates to this email</p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="cm-contact-email" className="block text-xs text-gray-600 mb-1">Email</label>
                  <input
                    id="cm-contact-email"
                    type="email"
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 border-gray-300"
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setContactEmail(v);
                      setContactValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
                    }}
                    autoComplete="email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cm-contact-name" className="block text-xs text-gray-600 mb-1">Full name (optional)</label>
                    <input
                      id="cm-contact-name"
                      type="text"
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 border-gray-300"
                      placeholder="John Doe"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      autoCapitalize="words"
                    />
                  </div>
                  <div>
                    <label htmlFor="cm-contact-phone" className="block text-xs text-gray-600 mb-1">Phone (optional)</label>
                    <input
                      id="cm-contact-phone"
                      type="tel"
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 border-gray-300"
                      placeholder="+15551234567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'shipping' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Shipping address</h3>
              <p className="text-xs text-gray-500 mb-3">Enter where your order will be shipped</p>
              <AddressForm
                addressType="shipping"
                value={shipping}
                onChange={(v, valid) => { setShipping(v); setShippingValid(valid); }}
                disabled={isSubmitting}
              />
            </div>

            <div className="border rounded-xl p-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={useBillingForShipping}
                  onChange={(e) => setUseBillingForShipping(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="text-gray-600">Billing address is the same as shipping</span>
              </label>
            </div>

            {!useBillingForShipping && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Billing address</h3>
                <p className="text-xs text-gray-500 mb-3">Enter your billing details</p>
                <AddressForm
                  addressType="billing"
                  value={billing}
                  onChange={(v, valid) => { setBilling(v); setBillingValid(valid); }}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        )}

        {step === 'payment' && (
          <PaymentForm
            {...(userId ? { userId } : {})}
            {...(checkoutSessionId ? { checkoutSessionId } : {})}
            contactEmail={contactEmail || undefined}
            contactName={contactName || undefined}
            onSuccess={async ({ paymentIntentId }) => {
              try {
                const res = await fetch('/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    paymentIntentId,
                    ...(checkoutSessionId ? { checkoutSessionId } : {}),
                    ...(sessionId ? { sessionId } : {}),
                    ...(contactEmail ? { email: contactEmail } : {}),
                    billing_address: useBillingForShipping ? shipping : billing,
                    shipping_address: shipping,
                  }),
                });
                const json = await res.json();
                if (!res.ok || json.error) throw new Error(json.error || 'Failed to create order');
                setOrderNumber(json.orderNumber || null);
                setOrderTotal(typeof json.total === 'number' ? json.total : null);
                setStep('confirm');
              } catch (e: any) {
                setServerError(e.message || 'Failed to finalize order');
              }
            }}
            onError={(msg) => setServerError(msg)}
          />
        )}

        {step === 'confirm' && (
          <OrderConfirmation orderNumber={orderNumber || undefined} total={orderTotal || undefined} onDone={onClose} />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sticky bottom-0">
        {step === 'contact' && (
          <>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              onClick={handleBack}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${canContinue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
              disabled={!canContinue || isSubmitting}
              onClick={() => setStep('shipping')}
            >
              Continue to shipping
            </button>
          </>
        )}

        {step === 'shipping' && (
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${canContinue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
            disabled={!canContinue || isSubmitting}
            onClick={handleSubmitAddresses}
          >
            Continue to payment
          </button>
        )}
      </div>
    </motion.div>
  );
}


