'use client';

import { Provider } from 'react-redux';

import { ErrorBoundary } from '@/components/error/error-boundary';
import Home from '@/components/iphone/Interface/Home/Home';
import IPhoneShell from '@/components/iphone/iphone-shell';
import { store } from '@/store/store';

export default function HomePage() {
  return (
    <Provider store={store}>
      <ErrorBoundary
        level='section'
        showDetails={process.env.NODE_ENV === 'development'}
      >
        <IPhoneShell>
          <ErrorBoundary
            level='section'
            showDetails={process.env.NODE_ENV === 'development'}
          >
            <Home />
          </ErrorBoundary>
        </IPhoneShell>
      </ErrorBoundary>
    </Provider>
  );
}
