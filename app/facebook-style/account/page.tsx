import { FacebookFooter } from 'components/facebook-style/facebook-footer';
import { FacebookHeader } from 'components/facebook-style/facebook-header';
import { getCustomer } from 'lib/shopify';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function FacebookAccountPage() {
  const accessToken = (await cookies()).get('customerAccessToken')?.value;

  if (!accessToken) {
    redirect('/login?redirect=/facebook-style/account');
  }

  const customer = await getCustomer(accessToken);

  if (!customer) {
    redirect('/login?redirect=/facebook-style/account');
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f2f5]">
      <FacebookHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* Page Title */}
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Account Information</h1>

          {/* Profile Card */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3b5998] text-3xl font-bold text-white">
                {customer.firstName?.charAt(0) || customer.email?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {customer.firstName} {customer.lastName}
                </h2>
                <p className="text-sm text-gray-600">{customer.email}</p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <p className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                      {customer.firstName || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <p className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                      {customer.lastName || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                      {customer.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                      {customer.phone || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Default Address */}
              {customer.defaultAddress && (
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">Default Address</h3>
                  <div className="rounded-md border border-gray-300 bg-gray-50 p-4">
                    <p className="text-sm text-gray-900">{customer.defaultAddress.address1}</p>
                    {customer.defaultAddress.address2 && (
                      <p className="text-sm text-gray-900">{customer.defaultAddress.address2}</p>
                    )}
                    <p className="text-sm text-gray-900">
                      {customer.defaultAddress.city}, {customer.defaultAddress.province}{' '}
                      {customer.defaultAddress.zip}
                    </p>
                    <p className="text-sm text-gray-900">{customer.defaultAddress.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/facebook-style/orders"
              className="flex items-center gap-4 rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 text-[#3b5998]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600">View all your orders</p>
              </div>
            </Link>

            <Link
              href="/facebook-style/wishlist"
              className="flex items-center gap-4 rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 text-red-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Wishlist</h3>
                <p className="text-sm text-gray-600">View saved items</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <FacebookFooter />
    </div>
  );
}
