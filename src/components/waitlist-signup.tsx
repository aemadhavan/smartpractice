import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, GraduationCap, CheckCircle } from "lucide-react";

const WaitlistSignup = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1000);
  };

  const features = [
    "Personalized practice tests aligned with Victorian Selective Entry exam",
    "Comprehensive coverage of all test areas: Reasoning – Reading, Reasoning – Mathematics , General ability – Verbal, General ability – Quantitative and Writing",
    "Real-time performance tracking and progress insights",
    "AI-designed questions matching actual exam difficulty"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
            <GraduationCap size={16} />
            <span className="text-sm font-medium">Early Access</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight">
            Master the Victorian Selective Entry High School Exam
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Smart Practise uses AI to create practise tests, 
            helping students achieve their best in the Victorian Selective Entry High School exam.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  disabled={status === 'loading' || status === 'success'}
                />
                <Button 
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="inline-flex items-center gap-2"
                >
                  {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
                  <ArrowRight size={16} />
                </Button>
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
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Why Smart Practise?</h3>
              <p className="text-gray-600">Join hundreds of students already preparing smarter</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* <div className="text-center">
                <div className="font-semibold text-2xl text-purple-700">98%</div>
                <div className="text-sm text-gray-600">Practice Completion Rate</div>
              </div> */}
              <div className="text-center">
                <div className="font-semibold text-2xl text-purple-700">2000+</div>
                <div className="text-sm text-gray-600">Practice Questions</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl text-purple-700"></div>
                <div className="text-sm text-gray-600">Student Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl text-purple-700"></div>
                <div className="text-sm text-gray-600">Score Improvement</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistSignup;