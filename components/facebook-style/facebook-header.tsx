import CartModal from 'components/cart/modal';
import { getMenu } from 'lib/shopify';
import { Menu } from 'lib/shopify/types';
import Link from 'next/link';
import { Suspense } from 'react';
import { FacebookAccountMenu } from './account-menu';
import { FacebookWishlistButton } from './wishlist-button';

export async function FacebookHeader() {
  const menu = await getMenu('next-js-frontend-header-menu');

  return (
    <header className="border-b border-[#2c4373] bg-[#3b5998] shadow-md">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between px-4 pb-3 pt-4">
          {/* Left: Logo and Site Name */}
          <div className="flex items-end gap-6">
            {/* Logo - fixed width to match sidebar */}
            <Link href="/" className="shrink-0" prefetch={true}>
              <span className="inline-block w-[180px] text-[40px] font-bold lowercase leading-none tracking-[-0.06em] text-white">
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

          {/* Right: Wishlist, User, Cart */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <FacebookWishlistButton />

            {/* User Account */}
            <FacebookAccountMenu />

            {/* Cart - Rightmost */}
            <div className="text-white">
              <CartModal />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
