'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { loadStripe, Stripe, StripeElements, StripePaymentRequest, PaymentRequestPaymentMethodEvent } from '@stripe/stripe-js';

import { validateClientEnv } from '@/lib/validations/env';
import { getCartSessionId } from '@/utils/cartSync';

interface PaymentFormProps {
  userId?: string;
  checkoutSessionId?: string;
  contactEmail?: string;
  contactName?: string;
  onSuccess: (result: { paymentIntentId: string; clientSecret: string }) => void;
  onError?: (message: string) => void;
}

export default function PaymentForm({ userId, checkoutSessionId, contactEmail, contactName, onSuccess, onError }: PaymentFormProps) {
  const sessionId = !userId ? getCartSessionId() : undefined;

  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('usd');
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  const paymentElementRef = useRef<HTMLDivElement | null>(null);
  const prButtonRef = useRef<HTMLDivElement | null>(null);
  const paymentElementInstance = useRef<ReturnType<StripeElements['create']> | null>(null);
  const prInstance = useRef<StripePaymentRequest | null>(null);

  const showError = useCallback((msg: string) => {
    setError(msg);
    onError?.(msg);
  }, [onError]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Load publishable key
        const env = validateClientEnv();
        const stripeJs = await loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        if (!stripeJs) throw new Error('Failed to load Stripe');
        if (!isMounted) return;
        setStripe(stripeJs);

        // Get totals for Payment Request and create PaymentIntent
        const params = new URLSearchParams(
          userId ? { userId } : (sessionId ? { sessionId } : {}) as Record<string, string>
        );
        const cartRes = await fetch(`/api/cart?${params.toString()}`, { cache: 'no-store' });
        if (cartRes.ok) {
          const cartJson = await cartRes.json();
          const cart = cartJson?.cart;
          if (cart?.total) {
            setTotal(Number(cart.total));
          }
          setCurrency('usd');
        }

        const piRes = await fetch('/api/checkout/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(checkoutSessionId ? { checkoutSessionId } : {}),
            ...(sessionId ? { sessionId } : {}),
            ...(contactEmail ? { email: contactEmail } : {}),
            ...(contactName ? { name: contactName } : {}),
          }),
        });
        const piJson = await piRes.json();
        if (!piRes.ok || piJson.error) {
          throw new Error(piJson.error || 'Failed to create payment intent');
        }
        const cs = String(piJson.clientSecret);
        setClientSecret(cs);

        const elems = stripeJs.elements({ clientSecret: cs });
        setElements(elems);

        // Payment Element
        if (paymentElementRef.current) {
          const paymentEl = elems.create('payment', {
            layout: { type: 'tabs' },
          } as any);
          paymentEl.mount(paymentElementRef.current);
          paymentElementInstance.current = paymentEl;
        }

        // Apple Pay / Payment Request Button
        if (total > 0) {
          const pr = stripeJs.paymentRequest({
            country: 'US',
            currency: currency,
            total: { label: 'CultureMade Order', amount: Math.round(Number(total) * 100) },
            requestPayerEmail: true,
          });

          const canPay = await pr.canMakePayment();
          if (canPay && prButtonRef.current) {
            setApplePayAvailable(true);
            prInstance.current = pr;
            const prButtonElement = elems.create('paymentRequestButton', {
              paymentRequest: pr,
              style: { paymentRequestButton: { type: 'default', theme: 'dark', height: '40px' } },
            } as any);
            prButtonElement.mount(prButtonRef.current);

            pr.on('paymentmethod', async (ev: PaymentRequestPaymentMethodEvent) => {
              try {
                if (!cs) throw new Error('Missing client secret');
                const { paymentIntent, error: confirmError } = await stripeJs.confirmCardPayment(cs, {
                  payment_method: ev.paymentMethod.id,
                }, { handleActions: true });

                if (confirmError) {
                  ev.complete('fail');
                  return showError(confirmError.message || 'Payment failed');
                }
                ev.complete('success');
                if (paymentIntent && paymentIntent.status === 'succeeded') {
                  onSuccess({ paymentIntentId: paymentIntent.id, clientSecret: cs });
                }
              } catch (err: any) {
                ev.complete('fail');
                showError(err.message || 'Payment failed');
              }
            });
          }
        }
      } catch (err: any) {
        showError(err.message || 'Failed to initialize payment');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      try {
        paymentElementInstance.current?.unmount?.();
      } catch {}
    };
  }, [userId, sessionId, showError, total, currency]);

  const handleConfirm = useCallback(async () => {
    if (!stripe || !elements || !clientSecret || isConfirming) return;
    setIsConfirming(true);
    try {
      // Validate and submit payment element inputs per Stripe deferred flow
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setIsConfirming(false);
        return showError(submitError.message || 'Please check your payment details');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
      });
      if (confirmError) return showError(confirmError.message || 'Payment failed');
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_action')) {
        onSuccess({ paymentIntentId: paymentIntent.id, clientSecret });
      }
    } catch (err: any) {
      showError(err.message || 'Payment failed');
    } finally {
      setIsConfirming(false);
    }
  }, [stripe, elements, clientSecret, onSuccess, showError, isConfirming]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {applePayAvailable && (
        <div className="mb-2">
          <div ref={prButtonRef} />
          <p className="text-[11px] text-gray-500 mt-1">You can pay with Apple Pay on supported devices.</p>
        </div>
      )}

      <div className="border rounded-lg p-3">
        <div ref={paymentElementRef} />
      </div>

      <button
        disabled={isLoading || !clientSecret || isConfirming}
        onClick={handleConfirm}
        className={`w-full px-4 py-2 rounded-lg text-sm font-semibold text-white ${isLoading || !clientSecret || isConfirming ? 'bg-gray-400' : 'bg-admin-accent hover:bg-admin-accent-hover'}`}
      >
        {isLoading ? 'Loading payment...' : isConfirming ? 'Processing…' : 'Pay now'}
      </button>
    </div>
  );
}


