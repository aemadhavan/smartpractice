'use client';

import Container from "@/components/Container";
import Link from "next/link";
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 mb-8 border-t border-gray-100 pt-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Smart Practise */}
          <div>
            <h3 className="font-bold mb-4">Smart Practise</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your path to exam excellence. Specialized preparation for Victorian Selective Entry High School exams.
            </p>
          </div>

          {/* Column 2: Practice Areas */}
          <div>
            <h3 className="font-bold mb-4">Practice Areas</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/reading" className="text-sm text-blue-600 hover:underline">
                  Reading
                </Link>
              </li>
              <li>
                <Link href="/writing" className="text-sm text-blue-600 hover:underline">
                  Writing
                </Link>
              </li>
              <li>
                <Link href="/mathematics" className="text-sm text-blue-600 hover:underline">
                  Mathematics
                </Link>
              </li>
              <li>
                <Link href="/verbal-reasoning" className="text-sm text-blue-600 hover:underline">
                  Verbal Reasoning
                </Link>
              </li>
              <li>
                <Link href="/quantitative-reasoning" className="text-sm text-blue-600 hover:underline">
                  Quantitative Reasoning
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/practice-tests" className="text-sm text-blue-600 hover:underline">
                  Practice Tests
                </Link>
              </li>
              <li>
                <Link href="/study-guides" className="text-sm text-blue-600 hover:underline">
                  Study Guides
                </Link>
              </li>
              <li>
                <Link href="/exam-tips" className="text-sm text-blue-600 hover:underline">
                  Exam Tips
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-blue-600 hover:underline">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-bold mb-4">Contact</h3>
            <p className="text-sm text-gray-600 mb-2">
              <a href="mailto:support@smartpractise.com.au" className="hover:underline">
                support@smartpractise.com.au
              </a>
            </p>
            <p className="text-sm text-gray-600 mb-4">Melbourne, Victoria</p>
            
            <div className="flex gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-400 transition-colors"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright Line */}
        <div className="pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Smart Practise. All rights reserved.
          </p>
        </div>
        
        {/* Legal Links - Hidden but kept for functionality */}
        <div className="hidden">
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
      </Container>
    </footer>
  );
}