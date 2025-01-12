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
      {/* Early Access Badge */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
          <GraduationCap className="w-4 h-4" />
          <span>Early Access</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Master the Victorian Selective Entry High School Exam
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Smart Practise uses AI to create practise tests, helping students achieve 
          their best in the Victorian Selective Entry High School exam.
        </p>
      </div>

      {/* Features List */}
      <div className="space-y-6 mb-12">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-green-500">✓</div>
          <div>
            <p className="text-gray-900">
              Personalized practice tests aligned with Victorian Selective Entry exam
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 text-green-500">✓</div>
          <div>
            <p className="text-gray-900">
              Comprehensive coverage of all test areas: Reasoning – Reading, 
              Reasoning – Mathematics, General ability – Verbal, General ability – 
              Quantitative and Writing
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 text-green-500">✓</div>
          <div>
            <p className="text-gray-900">
              Real-time performance tracking and progress insights
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 text-green-500">✓</div>
          <div>
            <p className="text-gray-900">
              AI-designed questions matching actual exam difficulty
            </p>
          </div>
        </div>
      </div>

      {/* Waitlist Form - Moved to middle */}
      <div className="mb-16">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={status === 'loading'  || !consent}
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
                Thanks for joining! We'll notify you when early access is available.
                You can unsubscribe at any time.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </div>

      {/* Stats Section */}
      <div className="bg-purple-50 rounded-xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-center mb-4">
          Why Smart Practise?
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Join hundreds of students already preparing smarter
        </p>
        <div className="flex justify-center gap-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-700">2000+</div>
            <div className="text-sm text-gray-600">Practice Questions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-700">95%</div>
            <div className="text-sm text-gray-600">Student Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-700">30%</div>
            <div className="text-sm text-gray-600">Score Improvement</div>
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