import { Resend } from 'resend';

import { validateServerEnv } from '@/lib/validations/env';

type OrderItemEmail = {
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
  subtotal: number;
};

export type SendOrderConfirmationParams = {
  to: string;
  order: {
    id: string;
    order_number: string;
    total_amount: number;
    currency: string;
    items: OrderItemEmail[];
  };
};

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams) {
  const env = validateServerEnv();
  const resend = new Resend(env.RESEND_API_KEY);

  const { to, order } = params;

  const itemsText = order.items
    .map((i) => `- ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''} x${i.quantity} — $${Number(i.subtotal).toFixed(2)}`)
    .join('\n');

  const text = `Thank you for your order!\n\nOrder Number: ${order.order_number}\nTotal: $${Number(order.total_amount).toFixed(2)} ${order.currency}\n\nItems:\n${itemsText}\n\nWe will notify you when your order ships.`;

  try {
    await resend.emails.send({
      from: 'CultureMade <orders@culturemade.dev>',
      to,
      subject: `Your CultureMade order ${order.order_number}`,
      text,
    });
  } catch (err) {
    // Swallow email errors; logging could be added later
  }
}


