import Stripe from 'stripe';

import { validateServerEnv } from '@/lib/validations/env';

// Create and export a singleton Stripe client for server-side usage
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const env = validateServerEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY in environment');
  }

  stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
    typescript: true,
  });

  return stripeClient;
}

export type StripeCustomerParams = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  metadata?: Record<string, string>;
};

export async function createStripeCustomer(params: StripeCustomerParams) {
  const stripe = getStripe();
  const payload: Stripe.CustomerCreateParams = {
    ...(params.email ? { email: params.email } : {}),
    ...(params.name ? { name: params.name } : {}),
    ...(params.phone ? { phone: params.phone } : {}),
    ...(params.metadata ? { metadata: params.metadata } : {}),
  };
  return stripe.customers.create(payload);
}

export function toStripeAmountCents(amount: number): number {
  // Stripe expects amounts in the smallest currency unit, e.g. cents for USD
  return Math.round(amount * 100);
}


