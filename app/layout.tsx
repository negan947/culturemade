import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

import { ErrorBoundary } from '@/components/error/error-boundary';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CULTUREMADE - Coming Soon',
  description:
    "Something raw is coming. A space where culture meets commerce, where every piece tells a story, where authenticity isn't just a word.",
  keywords: [
    'culture',
    'streetwear',
    'fashion',
    'authentic',
    'exclusive',
    'coming soon',
  ],
  authors: [{ name: 'CultureMade' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  icons: {
    icon: [
      { url: '/CM_Logo.jpg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/CM_Logo.jpg', sizes: '16x16', type: 'image/jpeg' },
    ],
    apple: [{ url: '/CM_Logo.jpg', sizes: '180x180', type: 'image/jpeg' }],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/CM_Logo.jpg',
      },
    ],
  },
  openGraph: {
    title: 'CULTUREMADE - Something Raw is Coming',
    description:
      "A space where culture meets commerce, where every piece tells a story, where authenticity isn't just a word.",
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/CM_Logo.jpg',
        width: 1200,
        height: 630,
        alt: 'CultureMade Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CULTUREMADE - Something Raw is Coming',
    description: 'A space where culture meets commerce. Coming soon.',
    images: ['/CM_Logo.jpg'],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('darkMode');
                  if (savedTheme === 'true' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} antialiased bg-black`}
        suppressHydrationWarning
      >
        <ErrorBoundary
          level='page'
          showDetails={process.env.NODE_ENV === 'development'}
        >
          {children}
        </ErrorBoundary>
        <Toaster 
          theme="system"
          position="top-right"
          expand={false}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
