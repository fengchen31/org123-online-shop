'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingDots from 'components/loading-dots';

interface PageProps {
  params: Promise<{
    id: string;
    token: string;
  }>;
}

export default function PasswordResetPage({ params }: PageProps) {
  const { id, token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Construct the Shopify reset URL
  const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
  const resetUrl = `https://${shopDomain}/account/reset/${id}/${token}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetUrl, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">Password reset successful!</p>
            <p className="mt-1 text-sm text-green-700">
              You are now logged in. Redirecting to homepage...
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                  placeholder="At least 6 characters"
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full border border-gray-300 px-4 py-2 focus:border-[#3b5998] focus:outline-none focus:ring-2 focus:ring-[#3b5998]/20"
                  placeholder="Enter password again"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3b5998] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex h-[1.25rem] items-center justify-center">
                {isLoading ? <LoadingDots className="bg-white" /> : 'Reset Password'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
