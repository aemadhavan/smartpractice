import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, GraduationCap } from "lucide-react";

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
      await response.json(); // Remove data variable since it's not used
      setStatus('success');
      setEmail('');
      setConsent(false);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Early Access Badge */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
          <GraduationCap className="w-4 h-4" />
          <span>Early Access</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-3">
          Master the Victorian Selective Entry High School Exam
        </h1>
        <p className="text-lg lg:text-xl text-gray-600 mb-6">
          Smart Practise is building an AI-powered platform to help students prepare effectively 
          for the Victorian Selective Entry High School exam. Join our waitlist to get early access 
          and special launch benefits.
        </p>
      </div>

      {/* Features List */}
      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-green-500">✓</div>
          <div>
            <p className="font-medium text-gray-900">Personalized Learning Experience</p>
            <p className="text-sm text-gray-600">
              Practice tests that adapt to your skill level and focus on areas where you need the most improvement
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 text-green-500">✓</div>
          <div>
            <p className="font-medium text-gray-900">Complete Exam Coverage</p>
            <p className="text-sm text-gray-600">
              Comprehensive practice materials covering all exam areas: Reading, Mathematics, 
              Verbal Reasoning, and Writing skills
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 text-green-500">✓</div>
          <div>
            <p className="font-medium text-gray-900">Progress Tracking</p>
            <p className="text-sm text-gray-600">
              Monitor your improvement with detailed performance insights and progress reports
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 text-green-500">✓</div>
          <div>
            <p className="font-medium text-gray-900">Smart Practice System</p>
            <p className="text-sm text-gray-600">
              AI-powered question generation that matches real exam patterns and difficulty levels
            </p>
          </div>
        </div>
      </div>

      {/* Waitlist Form */}
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              disabled={status === 'loading'}
              aria-label="Email address"
            />
            <Button 
              type="submit"
              disabled={status === 'loading' || !consent}
              className="inline-flex items-center gap-2 whitespace-nowrap"
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
              disabled={status === 'loading'}
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
                Welcome to Smart Practise! You&apos;re now on our exclusive early access list. 
                We&apos;ll keep you updated on our launch progress and notify you when we&apos;re ready. 
                Keep an eye on your inbox for important updates!
              </AlertDescription>
            </Alert>
          )}
        </form>
      </div>

      {/* Early Access Benefits Section */}
      <div className="bg-purple-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-center mb-3">
          Early Access Benefits
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Be among the first to experience our innovative learning platform
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-700 mb-1">
              Founding Member Access
            </div>
            <div className="text-sm text-gray-600">Get exclusive features and priority support</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-700 mb-1">
              Launch Pricing
            </div>
            <div className="text-sm text-gray-600">Special rates for early members</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-700 mb-1">
              Shape Our Platform
            </div>
            <div className="text-sm text-gray-600">Provide feedback and influence development</div>
          </div>
        </div>
      </div>

      <footer className="text-center text-sm text-gray-500">
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