//src/app/privacy/page.tsx

'use client';

import { useState } from 'react';
import PrivacyConsent from '@/components/PrivacyConsent';
import ContentLayout from '@/components/ContentLayout';

export default function PrivacyPage() {
  const [showDataRequest, setShowDataRequest] = useState(false);
  const [requestType, setRequestType] = useState<'access' | 'delete' | ''>('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this request to your backend
    console.log(`${requestType} request for ${email}`);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowDataRequest(false);
      setEmail('');
    }, 3000);
  };

  return (
    <ContentLayout title="" showAds={false}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-gray-500 mb-8">Last updated: Feb 25, 2025</p>

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
            <p className="mt-2">Website usage data through Google Analytics, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages visited</li>
              <li>Time and duration of visits</li>
              <li>Referral sources</li>
              <li>General location data</li>
            </ul>
            <p className="mt-2">When you interact with ads on our site:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Cookie data related to ad preferences</li>
              <li>Ad interaction information</li>
              <li>Personalization data for relevant ads</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>To manage your position on our waitlist</li>
              <li>To send you updates about our product launch and availability</li>
              <li>To communicate important changes or updates to our service</li>
              <li>To analyze and improve our waitlist system</li>
              <li>To display relevant advertisements through Google AdSense</li>
              <li>To personalize your experience on our site</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Google AdSense</h2>
            <p>
              We use Google AdSense to display advertisements on our website. Google AdSense may use cookies 
              to personalize ads based on your browsing behavior.
            </p>
            <p className="mt-2">
              Google&apos;s use of advertising cookies enables it and its partners to serve ads based on your visit 
              to our site and/or other sites on the Internet.
            </p>
            <p className="mt-2">
              You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google&apos;s Ads Settings</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Analytics</h2>
            <p>
              We use Google Analytics to analyze the use of our website. Google Analytics gathers 
              information about website use by means of cookies. The information gathered is used 
              to create reports about the use of our website. Google&apos;s privacy policy is available at: 
              https://www.google.com/policies/privacy/
            </p>
            <p className="mt-2">
              You can opt out of Google Analytics by using the Google Analytics Opt-out Browser Add-on: 
              https://tools.google.com/dlpage/gaoptout
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard security measures. 
              We retain your information only for as long as necessary to fulfill the purposes outlined 
              in this privacy policy or until you request its deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights Under GDPR and CCPA</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information:</p>
            
            <div className="mt-4 mb-4">
              <h3 className="text-xl font-medium mb-2">GDPR (European Union)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Right to access your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xl font-medium mb-2">CCPA (California)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Right to know what personal information is collected</li>
                <li>Right to know whether personal information is sold or disclosed</li>
                <li>Right to say no to the sale of personal information</li>
                <li>Right to access your personal information</li>
                <li>Right to request deletion of personal information</li>
                <li>Right to non-discrimination for exercising these rights</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <button 
                onClick={() => setShowDataRequest(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Exercise Your Data Rights
              </button>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or would like to exercise 
              your rights, please contact us at:
            </p>
            <p className="mt-2">
              Email: smartpractise.ai@gmail.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>
        </div>

        {/* Data Request Modal */}
        {showDataRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Data Request</h2>
              
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Request Type</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value as 'access' | 'delete' | '')}
                      required
                    >
                      <option value="">Select a request type</option>
                      <option value="access">Access My Data</option>
                      <option value="delete">Delete My Data</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Email Address</label>
                    <input 
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDataRequest(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center">
                  <p className="text-green-600 mb-4">Your request has been submitted successfully!</p>
                  <p>We will process your request and contact you at {email} within 30 days.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <PrivacyConsent />
      </div>
    </ContentLayout>
  );
}