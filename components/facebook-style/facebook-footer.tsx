import Link from 'next/link';

const currentYear = new Date().getFullYear();

export async function FacebookFooter() {
  return (
    <footer className="border-t border-gray-300 bg-white">
      {/* Bottom Bar */}
      <div className="bg-gray-50 py-3 sm:py-4">
        <div className="px-2 sm:px-4">
          <div className="flex flex-col items-center justify-center gap-2 text-[10px] text-gray-600 sm:flex-row sm:justify-between sm:text-xs">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3 md:gap-4">
              <Link href="/pages/contact-us" className="text-gray-600 hover:underline">
                Contact Us
              </Link>
              <Link href="/pages/shipping" className="text-gray-600 hover:underline">
                Shipping
              </Link>
              <Link href="/pages/returns" className="text-gray-600 hover:underline">
                Returns
              </Link>
              <Link href="/pages/privacy-policy" className="text-gray-600 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/pages/terms-of-service" className="text-gray-600 hover:underline">
                Terms of Service
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span>© {currentYear} org123.xyz</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
