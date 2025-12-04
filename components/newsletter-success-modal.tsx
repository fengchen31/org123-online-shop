'use client';

import { useEffect, useState } from 'react';

interface NewsletterSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountCode: string;
}

export function NewsletterSuccessModal({
  isOpen,
  onClose,
  discountCode
}: NewsletterSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-2xl">
        {/* Header */}
        <div className="relative bg-[#3b5998] px-4 py-3">
          <h2 className="text-sm font-bold text-white">Newsletter Subscription</h2>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-white transition-opacity hover:opacity-80"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="border-t border-gray-300 bg-[#f7f7f7] px-6 py-6">
          <div className="mb-5">
            <p className="mb-4 text-sm text-gray-900">
              Welcome! Thank you for subscribing to our newsletter!
            </p>
            <p className="text-xs text-gray-700">
              Here's your exclusive first-time subscriber discount code:
            </p>
          </div>

          {/* Discount Code */}
          <div className="mb-1 border border-gray-300 bg-white px-4 py-4 text-center">
            <p className="mb-2 text-2xl font-bold text-[#3b5998]">{discountCode}</p>
            <p className="text-xs text-gray-600">Special discount for new subscribers</p>
          </div>
        </div>

        {/* Footer with button */}
        <div className="border-t border-gray-300 bg-[#f2f2f2] px-4 py-3 text-right">
          <button
            onClick={handleCopy}
            className="bg-[#4267B2] px-6 py-2 text-xs font-bold text-white transition-colors hover:bg-[#365899]"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
