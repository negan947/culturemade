'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { getCartSessionId } from '@/utils/cartSync';

import AddressForm, { AddressFields, validateAddress } from './AddressForm';
import PaymentForm from './PaymentForm';
import OrderConfirmation from './OrderConfirmation';

type StepId = 'address' | 'payment' | 'confirm';

interface CheckoutModalProps {
  isOpen: boolean;
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

export default function CheckoutModal({ isOpen, onClose, userId }: CheckoutModalProps) {
  const sessionId = !userId ? getCartSessionId() : undefined;
  const [step, setStep] = useState<StepId>('address');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const isFinalized = step === 'confirm';

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

  const [useBillingForShipping, setUseBillingForShipping] = useState(true);
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

  const canContinue = useMemo(() => {
    if (step !== 'address') return true;
    if (useBillingForShipping) return billingValid;
    return billingValid && shippingValid;
  }, [step, billingValid, shippingValid, useBillingForShipping]);

  useEffect(() => {
    if (!isOpen) {
      setStep('address');
      setServerError(null);
    }
  }, [isOpen]);

  // Block accidental back actions once confirmed
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

  // Persist/restore checkout form state in localStorage (modal variant)
  useEffect(() => {
    try {
      const storedBilling = localStorage.getItem('cm_checkout_billing');
      if (storedBilling) {
        const parsed = JSON.parse(storedBilling) as AddressFields;
        setBilling(parsed);
        setBillingValid(validateAddress(parsed).success);
      }

      const storedUseBilling = localStorage.getItem('cm_checkout_use_billing_for_shipping');
      if (storedUseBilling) {
        setUseBillingForShipping(storedUseBilling === 'true');
      }

      const storedShipping = localStorage.getItem('cm_checkout_shipping');
      if (storedShipping) {
        const parsed = JSON.parse(storedShipping) as AddressFields;
        setShipping(parsed);
        setShippingValid(validateAddress(parsed).success);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cm_checkout_billing', JSON.stringify(billing));
    } catch {}
  }, [billing]);

  useEffect(() => {
    try {
      localStorage.setItem('cm_checkout_use_billing_for_shipping', String(useBillingForShipping));
    } catch {}
  }, [useBillingForShipping]);

  useEffect(() => {
    try {
      localStorage.setItem('cm_checkout_shipping', JSON.stringify(shipping));
    } catch {}
  }, [shipping]);

  const handleSubmitAddresses = async () => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      // Submit billing first
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

      // Submit shipping if not using billing for shipping
      if (!useBillingForShipping) {
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
      }

      setStep('payment');
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit addresses');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="absolute inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="absolute inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 400, duration: 0.4 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Checkout</h2>
                <p className="text-xs text-gray-500">Step {step === 'address' ? '1' : step === 'payment' ? '2' : '3'} of 3</p>
              </div>
              {step === 'confirm' ? (
                <div className="w-9" />
              ) : (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  aria-label="Close checkout"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-4 space-y-4">
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {serverError}
                </div>
              )}

              {step === 'address' && (
                <div className="space-y-6">
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

                  <div className="border rounded-xl p-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={useBillingForShipping}
                        onChange={(e) => setUseBillingForShipping(e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <span>Shipping address is the same as billing</span>
                    </label>
                  </div>

                  {!useBillingForShipping && (
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
                  )}
                </div>
              )}

              {step === 'payment' && (
                <PaymentForm
                  {...(userId ? { userId } : {})}
                  onSuccess={async ({ paymentIntentId }) => {
                    try {
                      const res = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          paymentIntentId,
                          ...(sessionId ? { sessionId } : {}),
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
                <OrderConfirmation orderNumber={orderNumber ?? undefined} total={orderTotal ?? undefined} onDone={onClose} />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                onClick={() => {
                  if (step === 'address') return onClose();
                  if (step === 'payment') return setStep('address');
                  if (step === 'confirm') return; // prevent going back after confirmation
                }}
              >
                {step === 'address' ? 'Cancel' : 'Back'}
              </button>

              {step === 'address' && (
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${canContinue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                  disabled={!canContinue || isSubmitting}
                  onClick={handleSubmitAddresses}
                >
                  Continue to payment
                </button>
              )}

              {step === 'payment' && null}

              {step === 'confirm' && null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


