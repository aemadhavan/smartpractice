'use client';

import Container from "@/components/Container";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 mb-8">
      <Container>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">Inner Sharp Consulting &copy; {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
              Privacy
            </Link>
            <button 
              onClick={() => {
                // Open privacy settings modal by triggering a storage event
                const event = new StorageEvent('storage', {
                  key: 'openPrivacySettings',
                  newValue: 'true'
                });
                window.dispatchEvent(event);
              }} 
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline cursor-pointer"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </Container>
    </footer>
  );
}