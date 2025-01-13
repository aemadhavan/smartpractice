// app/privacy/page.tsx
import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-slate max-w-none">
        <p className="text-sm text-gray-500 mb-8">Last updated: January 12, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Smart Practise (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, and protect your personal information 
            when you join our waitlist or interact with our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <p>We collect the following information when you join our waitlist:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Email address</li>
            <li>Referral source (if applicable)</li>
            <li>Timestamp of signup</li>
            <li>Your consent to receive updates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use your information solely for the following purposes:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>To manage your position on our waitlist</li>
            <li>To send you updates about our product launch and availability</li>
            <li>To communicate important changes or updates to our service</li>
            <li>To analyze and improve our waitlist system</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using industry-standard security measures. 
            We retain your information only for as long as necessary to fulfill the purposes outlined 
            in this privacy policy or until you request its deletion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Access your personal information</li>
            <li>Request correction of your personal information</li>
            <li>Request deletion of your personal information</li>
            <li>Withdraw your consent and unsubscribe from communications</li>
            <li>Lodge a complaint with the relevant data protection authority</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or would like to exercise 
            your rights, please contact us at:
          </p>
          <p className="mt-2">
            Email: smartpractise.ai@gmail.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </section>
      </div>
    </div>
  );
}