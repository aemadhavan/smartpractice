"use client";

import { SignedIn, SignedOut, 
  //SignInButton,
   UserButton } from "@clerk/nextjs";
import Container from "./Container";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [activeLink, setActiveLink] = useState("home");

  const navLinks = [
    { title: "Home", href: "/" },
    { title: "Practice Areas", href: "/practice-areas" },
    { title: "Resources", href: "/resources" },
    { title: "About Us", href: "/about" },
    { title: "Contact", href: "/contact" }
  ];

  return (
    <header className="py-4 border-b border-gray-100">
      <Container>
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/sp-logo-1.png" alt="Smart Practise Logo" width={40} height={40} />
              <div>
                <div className="font-bold text-lg">Smart Practise</div>
                <div className="text-xs text-gray-500">Your Path to Exam Excellence</div>
              </div>
            </Link>
          </div>
          
          {/* Main Navigation */}
          <nav className="hidden md:flex">
            <ul className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <li key={link.title}>
                  <Link 
                    href={link.href}
                    className={`text-sm font-medium hover:text-blue-600 transition-colors ${
                      activeLink === link.title.toLowerCase() ? "text-blue-600" : "text-gray-700"
                    }`}
                    onClick={() => setActiveLink(link.title.toLowerCase())}
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Authentication */}
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link 
                href="/sign-in" 
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Log In
              </Link>
              <Link 
                href="/sign-up" 
                className="rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </Container>
    </header>
  );
}