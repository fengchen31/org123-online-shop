import Link from 'next/link';
import { getMenu } from 'lib/shopify';
import { Suspense } from 'react';

const currentYear = new Date().getFullYear();

async function FooterContent() {
  const menu = await getMenu('next-js-frontend-footer-menu');

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
      {/* About Column */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase text-[#3b5998]">About</h3>
        <ul className="space-y-2 text-xs">
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              About org123.xyz
            </Link>
          </li>
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Contact Us
            </Link>
          </li>
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Careers
            </Link>
          </li>
        </ul>
      </div>

      {/* Shop Column */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase text-[#3b5998]">Shop</h3>
        <ul className="space-y-2 text-xs">
          {menu.length ? (
            menu.slice(0, 4).map((item) => (
              <li key={item.title}>
                <Link href={item.path} className="text-gray-600 hover:underline">
                  {item.title}
                </Link>
              </li>
            ))
          ) : (
            <>
              <li>
                <Link href="/search" className="text-gray-600 hover:underline">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-600 hover:underline">
                  Collections
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Help Column */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase text-[#3b5998]">Help</h3>
        <ul className="space-y-2 text-xs">
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Help Center
            </Link>
          </li>
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Shipping Info
            </Link>
          </li>
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Returns
            </Link>
          </li>
        </ul>
      </div>

      {/* Legal Column */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase text-[#3b5998]">Legal</h3>
        <ul className="space-y-2 text-xs">
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/" className="text-gray-600 hover:underline">
              Cookie Policy
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export async function FacebookFooter() {
  return (
    <footer className="border-t border-gray-300 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          }
        >
          <FooterContent />
        </Suspense>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-gray-50 py-4">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-gray-600 md:flex-row">
            <div className="flex items-center gap-4">
              <span>© {currentYear} org123.xyz</span>
              <span className="hidden md:inline">·</span>
              <Link href="/" className="hover:underline">
                English (US)
              </Link>
            </div>
            <div className="text-gray-500">Powered by org123.xyz</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
