//src/components/waitlist-signup.tsx

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight } from "lucide-react";

interface WaitlistData {
  email: string;
  timestamp: Date;
  consent: boolean;
  referralSource?: string;
}

const WaitlistSignup = () => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!consent) {
      setStatus('error');
      setErrorMessage('Please agree to the privacy policy');
      return;
    }

    setStatus('loading');
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          consent: true,
          referralSource: new URLSearchParams(window.location.search).get('ref')
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join waitlist');
      }

      const data = await response.json();
      setStatus('success');
      setEmail('');
      setConsent(false);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            disabled={status === 'loading' || status === 'success'}
            aria-label="Email address"
          />
          <Button 
            type="submit"
            disabled={status === 'loading' || status === 'success' || !consent}
            className="inline-flex items-center gap-2"
          >
            {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
            <ArrowRight size={16} />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked as boolean)}
            disabled={status === 'loading' || status === 'success'}
          />
          <label
            htmlFor="consent"
            className="text-sm text-gray-600"
          >
            I agree to receive emails about Smart Practise and accept the{' '}
            <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
          </label>
        </div>

        {status === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {status === 'success' && (
          <Alert className="bg-green-50 text-green-700 border-green-200">
            <AlertDescription>
              Thanks for joining! We'll notify you when early access is available.
              You can unsubscribe at any time.
            </AlertDescription>
          </Alert>
        )}
      </form>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>
          By joining, you acknowledge our{' '}
          <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
          {' '}and{' '}
          <a href="/terms" className="text-purple-600 hover:underline">Terms of Service</a>
        </p>
      </footer>
    </div>
  );
};

export default WaitlistSignup;