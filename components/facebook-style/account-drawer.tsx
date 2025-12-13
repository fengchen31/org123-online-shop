'use client';

import type { Customer, Order } from 'lib/shopify/types';
import LoadingDots from 'components/loading-dots';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { clearLocalCartAndSync } from 'components/cart/actions';
import { clearLocalWishlist } from 'components/wishlist/sync-wishlist-action';
import { restoreCartFromCustomer } from 'components/cart/sync-cart-action';
import { restoreWishlistFromCustomer } from 'components/wishlist/sync-wishlist-action';

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

type ViewMode = 'account' | 'login' | 'register' | 'forgot-password';

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
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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
  const [showUpgradeOption, setShowUpgradeOption] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Edit address state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState({
    address1: '',
    address2: '',
    city: '',
    province: '',
    zip: '',
    country: ''
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Newsletter subscription state
  const [isUpdatingNewsletter, setIsUpdatingNewsletter] = useState(false);

  // Change password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

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

      // Dispatch event to notify all components that user logged out
      window.dispatchEvent(new CustomEvent('authStatusChange', { detail: { isLoggedIn: false } }));

      // Don't call router.refresh() here - let collection-tabs-home handle it after cart clearing
      // router.refresh();
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

      // Login successful - clear local cart and wishlist, then restore from account

      // Clear local cart and wishlist
      await clearLocalCartAndSync();
      await clearLocalWishlist();

      // Restore cart and wishlist from account
      const [cartResult, wishlistResult] = await Promise.all([
        restoreCartFromCustomer(),
        restoreWishlistFromCustomer()
      ]);

      // Update UI
      await fetchCustomer();
      setLoginEmail('');
      setLoginPassword('');

      // Dispatch events to update UI
      if (wishlistResult.success) {
        window.dispatchEvent(
          new CustomEvent('wishlistUpdate', {
            detail: { count: wishlistResult.itemsRestored || 0 }
          })
        );
      }

      // Dispatch event to notify all components that user logged in
      window.dispatchEvent(new CustomEvent('authStatusChange', { detail: { isLoggedIn: true } }));

      // Refresh page to show synced cart
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
    setShowUpgradeOption(false);

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
        // Check if this is an "email already exists" error
        if (data.isEmailTaken) {
          setShowUpgradeOption(true);
          setUpgradeEmail(registerData.email);
          setRegisterError('');
        } else {
          throw new Error(data.error || 'Registration failed');
        }
        setIsRegisterLoading(false);
        return;
      }

      // Registration successful - clear local cart and wishlist (new account should start fresh)

      // Clear local cart and wishlist
      await clearLocalCartAndSync();
      await clearLocalWishlist();

      // Update UI
      await fetchCustomer();
      setRegisterData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Dispatch event to notify all components that user registered and logged in
      window.dispatchEvent(new CustomEvent('authStatusChange', { detail: { isLoggedIn: true } }));
      window.dispatchEvent(new CustomEvent('wishlistUpdate', { detail: { count: 0 } }));

      // Refresh page
      router.refresh();
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleUpgradeAccount = async () => {
    setIsUpgrading(true);
    setRegisterError('');

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: upgradeEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send password setup email');
      }

      setUpgradeSuccess(true);
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Password reset request failed');
      }

      // Success
      setForgotPasswordSuccess(true);
      setForgotPasswordEmail('');
    } catch (err) {
      setForgotPasswordError(err instanceof Error ? err.message : 'An error occurred during password reset');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg,image/webp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError('Image too large. Please select an image smaller than 5MB.');
        return;
      }

      setIsUploadingAvatar(true);
      setAvatarError('');

      try {
        // Compress and convert to base64
        const base64 = await compressImage(file);

        // Upload to server
        const res = await fetch('/api/customer/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarBase64: base64 })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload avatar');
        }

        // Refresh customer data to get new avatar
        await fetchCustomer();

        // Dispatch event to update avatar in other components (sidebar, header, etc.)
        window.dispatchEvent(new CustomEvent('avatarUpdate', {
          detail: { avatar: base64 }
        }));

        router.refresh();
      } catch (err) {
        setAvatarError(err instanceof Error ? err.message : 'Failed to upload avatar');
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    input.click();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 transition-opacity" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full bg-white transition-all duration-300 ease-in-out sm:w-[420px] md:w-[500px] ${
          isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            {viewMode === 'login' ? 'Sign In' : viewMode === 'register' ? 'Sign Up' : viewMode === 'forgot-password' ? 'Reset Password' : 'Account'}
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
              <LoadingDots className="text-gray-500" />
            </div>
          ) : viewMode === 'account' && customer ? (
            /* Logged In View */
            <>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
                <div
                  className="relative h-20 w-20 shrink-0 overflow-hidden border-2 border-gray-300 cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={handleAvatarClick}
                  title="Click to upload avatar"
                >
                  {isUploadingAvatar ? (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200">
                      <LoadingDots className="text-gray-600" />
                    </div>
                  ) : customer.avatar ? (
                    <Image
                      src={customer.avatar}
                      alt={`${customer.firstName} ${customer.lastName}`}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <Image
                      src="/images/avatars/org123xyz_head.svg"
                      alt="Default avatar"
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  )}
                  {/* Upload overlay on hover */}
                  {!isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {customer.firstName && customer.lastName
                      ? `${customer.firstName} ${customer.lastName}`
                      : customer.email}
                  </h3>
                  {avatarError && (
                    <p className="mt-1 text-xs text-red-600">{avatarError}</p>
                  )}
                  {!avatarError && !isUploadingAvatar && (
                    <p className="mt-1 text-xs text-gray-500">Click avatar to change</p>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  {!isEditingProfile && (
                    <button
                      onClick={() => {
                        setIsEditingProfile(true);
                        setEditFirstName(customer.firstName || '');
                        setEditLastName(customer.lastName || '');
                        setProfileError('');
                      }}
                      className="text-sm font-medium text-[#3b5998] hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {profileError && (
                  <div className="bg-red-50 p-3">
                    <p className="text-sm text-red-800">{profileError}</p>
                  </div>
                )}

                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="edit-firstName" className="block text-xs font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="edit-firstName"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                        placeholder="First name"
                        disabled={isSavingProfile}
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-lastName" className="block text-xs font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="edit-lastName"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                        placeholder="Last name"
                        disabled={isSavingProfile}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setIsSavingProfile(true);
                          setProfileError('');
                          try {
                            const res = await fetch('/api/customer/update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                firstName: editFirstName,
                                lastName: editLastName
                              })
                            });

                            const data = await res.json();

                            if (!res.ok) {
                              throw new Error(data.error || 'Failed to update profile');
                            }

                            // Refresh customer data
                            await fetchCustomer();
                            setIsEditingProfile(false);

                            // Notify other components that customer data has been updated
                            window.dispatchEvent(
                              new CustomEvent('customerUpdated', {
                                detail: { firstName: editFirstName, lastName: editLastName }
                              })
                            );

                            // Also refresh the page to update all components
                            router.refresh();
                          } catch (err) {
                            setProfileError(err instanceof Error ? err.message : 'An error occurred');
                          } finally {
                            setIsSavingProfile(false);
                          }
                        }}
                        disabled={isSavingProfile}
                        className="flex-1 bg-[#3b5998] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSavingProfile ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileError('');
                        }}
                        disabled={isSavingProfile}
                        className="flex-1 border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Marketing Preferences */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Marketing Preferences</h3>
                <div className="border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Newsletter Subscription</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Receive updates about new products and special offers
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setIsUpdatingNewsletter(true);
                        try {
                          const newValue = !customer.acceptsMarketing;
                          const res = await fetch('/api/customer/update-marketing', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ acceptsMarketing: newValue })
                          });

                          const data = await res.json();

                          if (!res.ok) {
                            throw new Error(data.error || 'Failed to update preferences');
                          }

                          await fetchCustomer();
                          router.refresh();
                        } catch (err) {
                          console.error('Failed to update newsletter preference:', err);
                        } finally {
                          setIsUpdatingNewsletter(false);
                        }
                      }}
                      disabled={isUpdatingNewsletter}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b5998] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        customer.acceptsMarketing ? 'bg-[#3b5998]' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={customer.acceptsMarketing}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          customer.acceptsMarketing ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Change Password</h3>
                  {!isChangingPassword && !passwordSuccess && (
                    <button
                      onClick={() => {
                        setIsChangingPassword(true);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmNewPassword: ''
                        });
                        setPasswordError('');
                      }}
                      className="text-sm font-medium text-[#3b5998] hover:underline"
                    >
                      Change
                    </button>
                  )}
                </div>

                {passwordError && (
                  <div className="bg-red-50 p-3">
                    <p className="text-sm text-red-800">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 p-3">
                    <div className="flex gap-3">
                      <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-green-900">Password changed successfully!</p>
                        <button
                          onClick={() => {
                            setPasswordSuccess(false);
                            setIsChangingPassword(false);
                          }}
                          className="mt-2 text-sm font-medium text-green-700 hover:underline"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isChangingPassword && !passwordSuccess ? (
                  <div className="space-y-3">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Current Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700">New Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                          placeholder="At least 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showNewPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Confirm New Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          value={passwordData.confirmNewPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                          }
                          className="w-full border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                          placeholder="Re-enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showConfirmNewPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setPasswordError('');

                          // Validation
                          if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
                            setPasswordError('Please fill in all fields');
                            return;
                          }

                          if (passwordData.newPassword.length < 6) {
                            setPasswordError('New password must be at least 6 characters');
                            return;
                          }

                          if (passwordData.newPassword !== passwordData.confirmNewPassword) {
                            setPasswordError('New passwords do not match');
                            return;
                          }

                          try {
                            const res = await fetch('/api/customer/change-password', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                currentPassword: passwordData.currentPassword,
                                newPassword: passwordData.newPassword
                              })
                            });

                            const data = await res.json();

                            if (!res.ok) {
                              throw new Error(data.error || 'Failed to change password');
                            }

                            setPasswordSuccess(true);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmNewPassword: ''
                            });
                          } catch (err) {
                            setPasswordError(err instanceof Error ? err.message : 'An error occurred');
                          }
                        }}
                        className="flex-1 bg-[#3b5998] px-4 py-2 text-sm font-semibold text-white hover:bg-[#344e86]"
                      >
                        Change Password
                      </button>
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordError('');
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmNewPassword: ''
                          });
                        }}
                        className="flex-1 border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : !passwordSuccess ? (
                  <div className="border border-gray-200 border-dashed p-4 text-center">
                    <p className="text-sm text-gray-500">Click "Change" to update your password</p>
                  </div>
                ) : null}
              </div>

              {/* Default Address */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Default Address</h3>
                  {!isEditingAddress && (
                    <button
                      onClick={() => {
                        setIsEditingAddress(true);
                        const addr = customer.defaultAddress;
                        setEditAddress({
                          address1: addr?.address1 || '',
                          address2: addr?.address2 || '',
                          city: addr?.city || '',
                          province: addr?.province || '',
                          zip: addr?.zip || '',
                          country: addr?.country || ''
                        });
                        setAddressError('');
                      }}
                      className="text-sm font-medium text-[#3b5998] hover:underline"
                    >
                      {customer.defaultAddress ? 'Edit' : 'Add Address'}
                    </button>
                  )}
                </div>

                {addressError && (
                  <div className="bg-red-50 p-3">
                    <p className="text-sm text-red-800">{addressError}</p>
                  </div>
                )}

                {isEditingAddress ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Address Line 1</label>
                      <input
                        type="text"
                        value={editAddress.address1}
                        onChange={(e) => setEditAddress({ ...editAddress, address1: e.target.value })}
                        className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Street address"
                        disabled={isSavingAddress}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={editAddress.address2}
                        onChange={(e) => setEditAddress({ ...editAddress, address2: e.target.value })}
                        className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Apt, suite, etc."
                        disabled={isSavingAddress}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">City</label>
                        <input
                          type="text"
                          value={editAddress.city}
                          onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                          className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                          disabled={isSavingAddress}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">State/Province</label>
                        <input
                          type="text"
                          value={editAddress.province}
                          onChange={(e) => setEditAddress({ ...editAddress, province: e.target.value })}
                          className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                          disabled={isSavingAddress}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">ZIP/Postal Code</label>
                        <input
                          type="text"
                          value={editAddress.zip}
                          onChange={(e) => setEditAddress({ ...editAddress, zip: e.target.value })}
                          className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                          disabled={isSavingAddress}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Country</label>
                        <input
                          type="text"
                          value={editAddress.country}
                          onChange={(e) => setEditAddress({ ...editAddress, country: e.target.value })}
                          className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                          disabled={isSavingAddress}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setIsSavingAddress(true);
                          setAddressError('');
                          try {
                            const res = await fetch('/api/customer/update-address', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(editAddress)
                            });

                            const data = await res.json();

                            if (!res.ok) {
                              throw new Error(data.error || 'Failed to update address');
                            }

                            await fetchCustomer();
                            setIsEditingAddress(false);
                            router.refresh();
                          } catch (err) {
                            setAddressError(err instanceof Error ? err.message : 'An error occurred');
                          } finally {
                            setIsSavingAddress(false);
                          }
                        }}
                        disabled={isSavingAddress}
                        className="flex-1 bg-[#3b5998] px-4 py-2 text-sm font-semibold text-white hover:bg-[#344e86] disabled:opacity-50"
                      >
                        {isSavingAddress ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingAddress(false);
                          setAddressError('');
                        }}
                        disabled={isSavingAddress}
                        className="flex-1 border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : customer.defaultAddress ? (
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
                ) : (
                  <div className="border border-gray-200 border-dashed p-4 text-center">
                    <p className="text-sm text-gray-500">No address on file</p>
                  </div>
                )}
              </div>

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
                    className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-0 focus:border-gray-300"
                    placeholder="your@email.com"
                    disabled={isLoginLoading}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot-password');
                        setLoginError('');
                        setForgotPasswordError('');
                        setForgotPasswordSuccess(false);
                      }}
                      className="text-xs font-medium text-[#3b5998] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-0 focus:border-gray-300"
                      placeholder="••••••••"
                      disabled={isLoginLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full bg-[#3b5998] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="inline-flex h-[1.25rem] items-center justify-center">
                    {isLoginLoading ? <LoadingDots className="text-white" /> : 'Sign in'}
                  </span>
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
          ) : viewMode === 'register' ? (
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

              {showUpgradeOption && !upgradeSuccess && (
                <div className="bg-blue-50 border border-blue-200 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-blue-600 mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900">Email Already Registered</h4>
                      <p className="mt-1 text-sm text-blue-800">
                        This email (<strong>{upgradeEmail}</strong>) is already in our system. Would you like
                        to set up a password and upgrade to a full member account?
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpgradeAccount}
                    disabled={isUpgrading}
                    className="w-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="inline-flex h-[1.25rem] items-center justify-center">
                      {isUpgrading ? <LoadingDots className="text-white" /> : 'Send Password Setup Email'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpgradeOption(false);
                      setUpgradeEmail('');
                      setRegisterData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        password: '',
                        confirmPassword: ''
                      });
                    }}
                    className="w-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Try Different Email
                  </button>
                </div>
              )}

              {upgradeSuccess && (
                <div className="bg-green-50 border border-green-200 p-4">
                  <div className="flex gap-3">
                    <svg
                      className="h-5 w-5 text-green-600 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-green-900">Email Sent!</h4>
                      <p className="mt-1 text-sm text-green-800">
                        Please check your email (<strong>{upgradeEmail}</strong>). Follow the instructions to set up
                        your password and complete your account upgrade.
                      </p>
                      <button
                        onClick={() => {
                          setViewMode('login');
                          setShowUpgradeOption(false);
                          setUpgradeSuccess(false);
                          setUpgradeEmail('');
                          setRegisterData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            password: '',
                            confirmPassword: ''
                          });
                        }}
                        className="mt-3 text-sm font-medium text-green-700 hover:text-green-800 hover:underline"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!showUpgradeOption && !upgradeSuccess && (
                <>
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
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="register-password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      minLength={6}
                      className="w-full border border-gray-300 px-4 py-2 pr-10 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                      placeholder="At least 6 characters"
                      disabled={isRegisterLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="register-confirmPassword"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="register-confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full border border-gray-300 px-4 py-2 pr-10 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                      placeholder="Enter password again"
                      disabled={isRegisterLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={isRegisterLoading}
                  className="w-full bg-[#3b5998] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="inline-flex h-[1.25rem] items-center justify-center">
                    {isRegisterLoading ? <LoadingDots className="text-white" /> : 'Sign up'}
                  </span>
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
                          setShowUpgradeOption(false);
                          setUpgradeSuccess(false);
                        }}
                        className="font-semibold text-[#3b5998] hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </>
              )}
              </div>
            </div>
          ) : viewMode === 'forgot-password' ? (
            /* Forgot Password View */
            <div className="overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Reset your password</h3>
                <p className="text-sm text-gray-600">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              {forgotPasswordError && (
                <div className="bg-red-50 p-4">
                  <p className="text-sm text-red-800">{forgotPasswordError}</p>
                </div>
              )}

              {forgotPasswordSuccess && (
                <div className="bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-800">
                    Password reset email sent!
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    Please check your email for instructions to reset your password.
                  </p>
                </div>
              )}

              {!forgotPasswordSuccess && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label htmlFor="forgot-password-email" className="mb-1 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="forgot-password-email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                      placeholder="your@email.com"
                      disabled={isForgotPasswordLoading}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isForgotPasswordLoading}
                    className="w-full bg-[#3b5998] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="inline-flex h-[1.25rem] items-center justify-center">
                      {isForgotPasswordLoading ? <LoadingDots className="text-white" /> : 'Send reset instructions'}
                    </span>
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Back to Login */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <button
                    onClick={() => {
                      setViewMode('login');
                      setForgotPasswordError('');
                      setForgotPasswordSuccess(false);
                      setForgotPasswordEmail('');
                    }}
                    className="font-semibold text-[#3b5998] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
