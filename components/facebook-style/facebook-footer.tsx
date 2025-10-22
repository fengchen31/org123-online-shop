import Link from 'next/link';

const currentYear = new Date().getFullYear();

export async function FacebookFooter() {
  return (
    <footer className="border-t border-gray-300 bg-white">
      {/* Bottom Bar */}
      <div className="bg-gray-50 py-4">
        <div className="px-4">
          <div className="flex flex-row items-center justify-between gap-2 text-xs text-gray-600">          
            <div className="flex flex-wrap items-center justify-start gap-4">
              <Link href="/" className="text-gray-600 hover:underline">
                Contact Us
              </Link>
              <Link href="/" className="text-gray-600 hover:underline">
                Shipping
              </Link>
              <Link href="/" className="text-gray-600 hover:underline">
                Returns
              </Link>
              <Link href="/" className="text-gray-600 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/" className="text-gray-600 hover:underline">
                Terms of Service
              </Link>
            </div>

             <div className="flex items-center gap-4">
              <span>© {currentYear} org123.xyz</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
