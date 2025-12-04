import { CartProvider } from 'components/cart/cart-context';
import { CurrencyProvider } from 'components/currency-context';
import { FacebookFooter } from 'components/facebook-style/facebook-footer';
import { FacebookHeader } from 'components/facebook-style/facebook-header';
import { GeistSans } from 'geist/font/sans';
import { getCart } from 'lib/shopify';
import { baseUrl } from 'lib/utils';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'org123.xyz',
    template: '%s | org123.xyz'
  },
  robots: {
    follow: true,
    index: true
  }
};

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="bg-[#e9eaed] text-gray-900">
        <CurrencyProvider>
          <CartProvider cartPromise={cart}>
            <FacebookHeader />
            <main className="min-h-screen">
              {children}
            </main>
            <FacebookFooter />
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
