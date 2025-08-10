'use client';

import React from 'react';

interface OrderConfirmationProps {
  orderNumber?: string;
  total?: number;
  onDone: () => void;
}

export default function OrderConfirmation({ orderNumber, total, onDone }: OrderConfirmationProps) {
  const formatPrice = (price?: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price || 0));

  return (
    <div className="text-center space-y-3">
      <div className="text-2xl font-bold text-green-600">Thank you!</div>
      <div className="text-sm text-gray-700">Your order has been placed.</div>
      {orderNumber && (
        <div className="text-sm text-gray-600">Order number: <span className="font-mono">{orderNumber}</span></div>
      )}
      <div className="text-sm text-gray-600">Total: {formatPrice(total)}</div>
      <div className="text-xs text-gray-500">A confirmation email will be sent shortly.</div>
      <button
        onClick={onDone}
        className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700"
      >
        Continue shopping
      </button>
    </div>
  );
}


