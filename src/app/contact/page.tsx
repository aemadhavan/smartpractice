'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // This would be replaced with your actual form submission logic
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Message sent successfully!",
        variant: "default",
      });
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about our exam preparation platform? We're here to help your child succeed.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 mb-12">
          {/* Contact Form */}
          <Card className="lg:w-2/3">
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help you?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Please provide details about your inquiry..."
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  variant="default"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Email</h3>
                    <a href="mailto:support@smartpractise.com.au" className="text-blue-600 hover:underline">
                      {/* support@smartpractise.com.au */}
                      smartpratise.ai@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Location</h3>
                    <p className="text-gray-600">Melbourne, Victoria</p>
                  </div>
                </div>
                
                {/* <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Support Hours</h3>
                    <p className="text-gray-600">Monday - Friday: 9am - 5pm AEST</p>
                    <p className="text-gray-600">Weekend: By email only</p>
                  </div>
                </div> */}
              </div>
            </div>
            
            {/* Social Media Links */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Connect With Us</h2>
              
              <div className="flex space-x-4">
                <a href="https://facebook.com/smartpractise" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd" clipRule="evenodd" />
                  </svg>
                </a>
                
                <a href="https://instagram.com/smartpractise" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-pink-100 transition-colors">
                  <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C9.284 2 8.944 2.01 7.877 2.06C6.813 2.11 6.086 2.277 5.45 2.525C4.796 2.782 4.234 3.128 3.678 3.678C3.128 4.234 2.782 4.796 2.525 5.45C2.277 6.086 2.11 6.813 2.06 7.877C2.01 8.944 2 9.284 2 12C2 14.716 2.01 15.056 2.06 16.123C2.11 17.187 2.277 17.914 2.525 18.55C2.782 19.204 3.128 19.766 3.678 20.322C4.234 20.872 4.796 21.218 5.45 21.475C6.086 21.723 6.813 21.89 7.877 21.94C8.944 21.99 9.284 22 12 22C14.716 22 15.056 21.99 16.123 21.94C17.187 21.89 17.914 21.723 18.55 21.475C19.204 21.218 19.766 20.872 20.322 20.322C20.872 19.766 21.218 19.204 21.475 18.55C21.723 17.914 21.89 17.187 21.94 16.123C21.99 15.056 22 14.716 22 12C22 9.284 21.99 8.944 21.94 7.877C21.89 6.813 21.723 6.086 21.475 5.45C21.218 4.796 20.872 4.234 20.322 3.678C19.766 3.128 19.204 2.782 18.55 2.525C17.914 2.277 17.187 2.11 16.123 2.06C15.056 2.01 14.716 2 12 2ZM12 4C14.669 4 14.986 4.01 16.042 4.06C17.021 4.107 17.551 4.265 17.895 4.398C18.34 4.568 18.66 4.768 18.996 5.104C19.331 5.44 19.532 5.76 19.702 6.204C19.834 6.549 19.992 7.08 20.039 8.058C20.089 9.115 20.099 9.434 20.099 12.103C20.099 14.771 20.089 15.09 20.039 16.146C19.992 17.125 19.834 17.655 19.702 18C19.532 18.445 19.331 18.764 18.996 19.1C18.66 19.435 18.34 19.636 17.895 19.806C17.551 19.938 17.021 20.096 16.042 20.143C14.986 20.193 14.669 20.203 12 20.203C9.331 20.203 9.014 20.193 7.958 20.143C6.979 20.096 6.449 19.938 6.105 19.806C5.66 19.636 5.34 19.435 5.004 19.1C4.669 18.764 4.468 18.445 4.298 18C4.166 17.655 4.008 17.125 3.961 16.146C3.911 15.09 3.901 14.771 3.901 12.103C3.901 9.434 3.911 9.115 3.961 8.058C4.008 7.08 4.166 6.549 4.298 6.204C4.468 5.76 4.669 5.44 5.004 5.104C5.34 4.768 5.66 4.568 6.105 4.398C6.449 4.265 6.979 4.107 7.958 4.06C9.014 4.01 9.331 4 12 4Z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 15.594C10.015 15.594 8.406 13.985 8.406 12C8.406 10.015 10.015 8.406 12 8.406C13.985 8.406 15.594 10.015 15.594 12C15.594 13.985 13.985 15.594 12 15.594ZM12 6.24C8.839 6.24 6.24 8.839 6.24 12C6.24 15.161 8.839 17.76 12 17.76C15.161 17.76 17.76 15.161 17.76 12C17.76 8.839 15.161 6.24 12 6.24Z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M18.546 6.159C18.546 6.909 17.939 7.515 17.19 7.515C16.44 7.515 15.834 6.909 15.834 6.159C15.834 5.41 16.44 4.804 17.19 4.804C17.939 4.804 18.546 5.41 18.546 6.159Z" />
                  </svg>
                </a>
                
                <a href="https://twitter.com/smartpractise" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-sky-100 transition-colors">
                  <svg className="w-6 h-6 text-sky-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.599-.1-.898a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How does Smart Practise help with selective exam preparation?</h3>
              <p className="text-gray-600">Smart Practise offers AI-powered adaptive learning that provides personalized questions and detailed feedback, helping students master all five exam categories.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Is Smart Practise suitable for all Year 8 students?</h3>
              <p className="text-gray-600">Yes, our platform is designed for students of all ability levels. The adaptive technology adjusts to each student's strengths and weaknesses.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How often should my child practice on the platform?</h3>
              <p className="text-gray-600">We recommend consistent practice of 3-5 sessions per week, with each session lasting 30-45 minutes for optimal results.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Do you offer parent resources or guidance?</h3>
              <p className="text-gray-600">Yes, Smart Practise provides parent dashboards, progress reports, and guidance on how to support your child through the exam preparation process.</p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of students preparing for selective school success with Smart Practise.
          </p>
          <Link 
            href="/register"
            className="inline-block py-3 px-8 bg-white text-blue-600 font-medium rounded-lg shadow-md hover:bg-gray-100 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </main>
    </div>
  );
}