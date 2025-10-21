import { FacebookFooter } from 'components/facebook-style/facebook-footer';
import { FacebookHeader } from 'components/facebook-style/facebook-header';
import { getCustomerOrders } from 'lib/shopify';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function FacebookOrdersPage() {
  const accessToken = (await cookies()).get('customerAccessToken')?.value;

  if (!accessToken) {
    redirect('/login?redirect=/facebook-style/orders');
  }

  const orders = await getCustomerOrders(accessToken, 20);

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f2f5]">
      <FacebookHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
            <p className="text-sm text-gray-600">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg bg-white p-12 shadow-sm">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-12 w-12 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">No orders yet</h2>
              <p className="mb-6 text-center text-gray-600">
                Start shopping to see your order history here!
              </p>
              <Link
                href="/"
                className="rounded-lg bg-[#3b5998] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e86]"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.processedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {order.totalPrice.currencyCode}{' '}
                        {parseFloat(order.totalPrice.amount).toFixed(2)}
                      </p>
                      <div className="mt-1 flex gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            order.financialStatus === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.financialStatus}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            order.fulfillmentStatus === 'FULFILLED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.fulfillmentStatus || 'UNFULFILLED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items - Show first 3 */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">Items:</p>
                    <div className="space-y-2">
                      {order.lineItems.edges.slice(0, 3).map((edge, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="font-medium">{edge.node.quantity}x</span>
                          <span>{edge.node.title}</span>
                        </div>
                      ))}
                      {order.lineItems.edges.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.lineItems.edges.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <FacebookFooter />
    </div>
  );
}
