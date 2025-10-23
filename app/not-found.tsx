'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage immediately
    router.push('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e9eaed]">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to homepage...</p>
      </div>
    </div>
  );
}
