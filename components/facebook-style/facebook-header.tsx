import CartModal from 'components/cart/modal';
import { getMenu } from 'lib/shopify';
import { Menu } from 'lib/shopify/types';
import Link from 'next/link';
import { Suspense } from 'react';

export async function FacebookHeader() {
  const menu = await getMenu('next-js-frontend-header-menu');

  return (
    <header className="sticky top-0 z-50 border-b border-[#2c4373] bg-[#3b5998] shadow-md">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between px-4 pb-2 pt-3">
          {/* Left: Logo and Site Name */}
          <div className="flex items-end gap-6">
            <Link href="/" className="flex items-center gap-2" prefetch={true}>
              <span className="text-2xl font-bold lowercase tracking-tight text-white">
                org123.xyz
              </span>
            </Link>

            {/* Navigation Menu */}
            {menu.length ? (
              <nav className="hidden md:block">
                <ul className="flex gap-4">
                  {menu.map((item: Menu) => (
                    <li key={item.title}>
                      <Link
                        href={item.path}
                        prefetch={true}
                        className="text-sm font-semibold text-white/90 transition-colors hover:text-white hover:underline"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>

          {/* Right: Search and Cart */}
          <div className="flex items-center gap-4">
            {/* Search Box with Label Above */}
            <div className="hidden md:block">
              <label className="mb-1 block text-right text-xs text-[#d9dfea]">Search</label>
              <input
                type="text"
                placeholder=""
                className="w-44 border border-white bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-300"
              />
            </div>

            {/* Cart */}
            <div className="text-white">
              <CartModal />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
