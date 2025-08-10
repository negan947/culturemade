'use client';

import { motion, useAnimation } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { getCartSessionId } from '@/utils/cartSync';

import AddressForm, { AddressFields } from '../components/AddressForm';
import PaymentForm from '../components/PaymentForm';
import OrderConfirmation from '../components/OrderConfirmation';

type StepId = 'address' | 'payment' | 'confirm';

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
  const [step, setStep] = useState<StepId>('address');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const controls = useAnimation();

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
    setServerError(null);
  }, [step]);

  useEffect(() => {
    // Ensure we start in-place for manual exit animation control
    controls.set({ x: 0, opacity: 1 });
  }, [controls]);

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

  const handleBack = async () => {
    if (step === 'address') {
      await controls.start({ x: '100%', opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } });
      onClose();
      return;
    }
    if (step === 'payment') return setStep('address');
    if (step === 'confirm') return setStep('payment');
  };

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
        <motion.button
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          aria-label="Back"
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Checkout</h2>
          <p className="text-xs text-gray-500">Step {step === 'address' ? '1' : step === 'payment' ? '2' : '3'} of 3</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={useBillingForShipping}
                  onChange={(e) => setUseBillingForShipping(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="text-gray-600">Shipping address is the same as billing</span>
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
            onSuccess={() => setStep('confirm')}
            onError={(msg) => setServerError(msg)}
          />
        )}

        {step === 'confirm' && (
          <OrderConfirmation onDone={onClose} />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-end gap-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sticky bottom-0">
        {step === 'address' && (
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


