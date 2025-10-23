'use client';

import type { Customer, Order } from 'lib/shopify/types';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

// Available login avatars
const LOGIN_AVATARS = [
  '/images/loginAvatars/CHP3SG__57026.jpg',
  '/images/loginAvatars/JELC3M__66939.jpg',
  '/images/loginAvatars/RR3F__13660.jpg',
  '/images/loginAvatars/RR3FC__50145.jpg',
  '/images/loginAvatars/TIM3TUR__22422.jpg'
];

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'account' | 'login' | 'register';

export function AccountDrawer({ isOpen, onClose }: AccountDrawerProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('account');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [registerError, setRegisterError] = useState('');
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // Randomly select an avatar (stable across re-renders)
  const randomAvatar = useMemo(() => {
    return LOGIN_AVATARS[Math.floor(Math.random() * LOGIN_AVATARS.length)] || LOGIN_AVATARS[0]!;
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCustomer();
    }
  }, [isOpen]);

  const fetchCustomer = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customer');
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        setViewMode('account');
      } else {
        setCustomer(null);
        setViewMode('login');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      setCustomer(null);
      setViewMode('login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (orders.length > 0) return; // Already loaded

    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const toggleOrders = () => {
    if (!isOrdersExpanded && orders.length === 0) {
      fetchOrders();
    }
    setIsOrdersExpanded(!isOrdersExpanded);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCustomer(null);
      setOrders([]);
      setIsOrdersExpanded(false);
      setViewMode('login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Login successful
      await fetchCustomer();
      setLoginEmail('');
      setLoginPassword('');
      router.refresh();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisterLoading(true);
    setRegisterError('');

    // Validate passwords
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Passwords do not match');
      setIsRegisterLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      setIsRegisterLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Registration successful, fetch customer data
      await fetchCustomer();
      setRegisterData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      router.refresh();
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 transition-opacity" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[420px] md:w-[500px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            {viewMode === 'login' ? 'Sign In' : viewMode === 'register' ? 'Sign Up' : 'Account'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-100 sm:h-8 sm:w-8"
            aria-label="Close"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-56px)] flex-col sm:h-[calc(100%-64px)]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center p-3 sm:p-4 md:p-6">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : viewMode === 'account' && customer ? (
            /* Logged In View */
            <>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gray-300">
                  <Image
                    src={randomAvatar}
                    alt={`${customer.firstName} ${customer.lastName}`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {customer.firstName && customer.lastName
                      ? `${customer.firstName} ${customer.lastName}`
                      : customer.email}
                  </h3>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Personal Information</h3>
                <div className="grid gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">First Name</label>
                    <p className="text-sm text-gray-900">{customer.firstName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Last Name</label>
                    <p className="text-sm text-gray-900">{customer.lastName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{customer.email}</p>
                  </div>
                </div>
              </div>

              {/* Default Address */}
              {customer.defaultAddress && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Default Address</h3>
                  <div className="border border-gray-200 p-4">
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

              {/* Order History - Collapsible */}
              <div className="space-y-2">
                <button
                  onClick={toggleOrders}
                  className="flex w-full items-center justify-between border border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                >
                  <span>Order History</span>
                  <svg
                    className={`h-5 w-5 transition-transform ${isOrdersExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Orders List */}
                {isOrdersExpanded && (
                  <div className="border border-t-0 border-gray-300 bg-gray-50 p-4">
                    {isLoadingOrders ? (
                      <div className="py-8 text-center text-sm text-gray-500">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="mb-2 text-sm font-medium text-gray-900">No orders yet</p>
                        <p className="text-xs text-gray-600">Start shopping to see your orders here!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-gray-200 bg-white p-3">
                            <div className="mb-2 flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">
                                  Order #{order.orderNumber}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {new Date(order.processedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {order.totalPrice.currencyCode}{' '}
                                  {Math.floor(parseFloat(order.totalPrice.amount)).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-semibold ${
                                  order.financialStatus === 'PAID'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {order.financialStatus}
                              </span>
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-semibold ${
                                  order.fulfillmentStatus === 'FULFILLED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.fulfillmentStatus || 'UNFULFILLED'}
                              </span>
                            </div>

                            {/* Order Items */}
                            {order.lineItems?.edges && order.lineItems.edges.length > 0 && (
                              <div className="mt-2 border-t border-gray-200 pt-2">
                                <div className="space-y-1">
                                  {order.lineItems.edges.slice(0, 2).map((edge, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                                      <span className="font-medium">{edge.node.quantity}x</span>
                                      <span className="truncate">{edge.node.title}</span>
                                    </div>
                                  ))}
                                  {order.lineItems.edges.length > 2 && (
                                    <p className="text-xs text-gray-500">
                                      +{order.lineItems.edges.length - 2} more items
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
                </div>
              </div>

              {/* Logout Button - Fixed at bottom */}
              <div className="border-t border-gray-200 p-3 sm:p-4 md:p-6">
                <button
                  onClick={handleLogout}
                  className="w-full bg-[#3b5998] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#344e86]"
                >
                  Log Out
                </button>
              </div>
            </>
          ) : viewMode === 'login' ? (
            /* Login View */
            <div className="overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Welcome back</h3>
                <p className="text-sm text-gray-600">Sign in to your account</p>
              </div>

              {loginError && (
                <div className="bg-red-50 p-4">
                  <p className="text-sm text-red-800">{loginError}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                    placeholder="your@email.com"
                    disabled={isLoginLoading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="login-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                    placeholder="••••••••"
                    disabled={isLoginLoading}
                  />
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full bg-[#3b5998] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoginLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Switch to Register */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setViewMode('register');
                      setLoginError('');
                    }}
                    className="font-semibold text-[#3b5998] hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
              </div>
            </div>
          ) : (
            /* Register View */
            <div className="overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Create account</h3>
                <p className="text-sm text-gray-600">Fill out the information below</p>
              </div>

              {registerError && (
                <div className="bg-red-50 p-4">
                  <p className="text-sm text-red-800">{registerError}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                {/* First Name */}
                <div>
                  <label htmlFor="register-firstName" className="mb-1 block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input
                    type="text"
                    id="register-firstName"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                    required
                    className="w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                    placeholder="John"
                    disabled={isRegisterLoading}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="register-lastName" className="mb-1 block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="register-lastName"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                    required
                    className="w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                    placeholder="Doe"
                    disabled={isRegisterLoading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    className="w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                    placeholder="your@email.com"
                    disabled={isRegisterLoading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="register-password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                    placeholder="At least 6 characters"
                    disabled={isRegisterLoading}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="register-confirmPassword"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Confirm password
                  </label>
                  <input
                    type="password"
                    id="register-confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                    placeholder="Enter password again"
                    disabled={isRegisterLoading}
                  />
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={isRegisterLoading}
                  className="w-full bg-[#3b5998] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRegisterLoading ? 'Signing up...' : 'Sign up'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Switch to Login */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setViewMode('login');
                      setRegisterError('');
                    }}
                    className="font-semibold text-[#3b5998] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
