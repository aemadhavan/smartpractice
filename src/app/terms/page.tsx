// app/terms/page.tsx
import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-slate max-w-none">
        <p className="text-sm text-gray-500 mb-8">Last updated: January 12, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing our website and joining our waitlist, you agree to be bound by these Terms of 
            Service and our Privacy Policy. If you disagree with any part of the terms, you may not 
            access our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Waitlist Service</h2>
          <p>
            Our waitlist service allows you to express interest in Smart Practise's upcoming educational 
            platform. By joining the waitlist:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>You agree to receive updates about our product and launch timeline</li>
            <li>You understand that joining the waitlist does not guarantee access to the service</li>
            <li>You acknowledge that launch dates and features may change</li>
            <li>You confirm that the information you provide is accurate</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Communications</h2>
          <p>
            By joining our waitlist, you consent to receive communications from us regarding our 
            service. You can opt-out of these communications at any time by:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Using the unsubscribe link in our emails</li>
            <li>Contacting us directly to request removal</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <p>
            The Smart Practise website, brand, and all related materials are protected by intellectual 
            property laws. You may not use our intellectual property without our prior written consent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
          <p>
            Smart Practise shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages resulting from your use or inability to use our service or website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any 
            material changes via email or through our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of Australia, 
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
          <p>
            For any questions about these Terms of Service, please contact us at:
          </p>
          <p className="mt-2">
            Email: smartpractise.ai@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}