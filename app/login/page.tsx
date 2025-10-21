'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const redirect = searchParams.get('redirect') || '/';

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // This is a demo implementation
      // In a real app, you would call your Shopify OAuth endpoint here
      // For now, we'll just set a demo cookie
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@example.com' })
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      router.push(redirect);
    } catch (err) {
      setError('Login failed. This is a demo page - please configure Shopify OAuth for real authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f2f5]">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-[#3b5998]">org123.xyz</h1>
            <p className="text-lg text-gray-600">Sign in to your account</p>
          </div>

          {/* Login Card */}
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Welcome Back</h2>
              <p className="text-sm text-gray-600">
                This is a demo login page. In production, this would integrate with Shopify Customer Account API.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Demo Login Button */}
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full rounded-lg bg-[#3b5998] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Demo Login (Development Only)'}
            </button>

            {/* Information Box */}
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-900">
                For Production Use:
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Configure Shopify Customer Account API credentials</li>
                <li>• Set up OAuth flow in .env file</li>
                <li>• Implement proper authentication endpoints</li>
                <li>• See CLAUDE.md for setup instructions</li>
              </ul>
            </div>

            {/* Back Link */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-[#3b5998] hover:underline"
              >
                ← Back to Home
              </Link>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">Environment Variables Needed:</h3>
            <div className="space-y-2 font-mono text-xs text-gray-700">
              <p>SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID</p>
              <p>SHOPIFY_CUSTOMER_ACCOUNT_API_URL</p>
              <p>NEXTAUTH_SECRET</p>
              <p>NEXTAUTH_URL</p>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Check <code className="rounded bg-gray-100 px-1 py-0.5">.env.example</code> for details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
