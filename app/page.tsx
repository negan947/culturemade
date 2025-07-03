'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import IPhoneShell from '@/components/iphone/iphone-shell';

export default function HomePage() {
  return (
    <Provider store={store}>
      <IPhoneShell />
    </Provider>
  );
}
