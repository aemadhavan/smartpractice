'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Story</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From one parent's journey to a community of dreamers and achievers
          </p>
        </div>

        {/* Origin Story */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
          <div className="md:w-1/2">
            <Image 
              src="/images/parent-and-child-studying.jpg" 
              width={600} 
              height={400} 
              alt="Parent helping child study" 
              className="rounded-xl shadow-lg"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">It Started with a Dream</h2>
            <p className="text-lg text-gray-700 mb-4">
              Like many stories of innovation, Smart Practise began with a parent's love and determination. 
              When my own child faced the challenge of preparing for Victoria's selective high school exam, 
              I discovered a gap in the resources available—nothing that truly adapted to individual learning styles 
              or provided the kind of personalized feedback that makes learning stick.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Late nights after work became devoted to creating practice questions, developing 
              explanations, and building a system that could grow with my child's progress. What started 
              as spreadsheets and handwritten notes gradually evolved into something more.
            </p>
            <p className="text-lg text-gray-700">
              When other parents began asking to use our resources, I realized this could help not just one child, 
              but an entire community of young learners with big dreams.
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-blue-50 rounded-2xl p-10 mb-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto">
            To empower every student with the tools, confidence, and personalized learning experience 
            they need to succeed in selective school exams, while supporting parents as they guide their 
            children toward academic excellence.
          </p>
        </div>

        {/* What Makes Us Different */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">What Makes Us Different</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 transition-transform hover:transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">Built by Parents, for Parents</h3>
              <p className="text-gray-600">
                We understand the unique challenges of guiding a child through selective exams because 
                we've lived it. Our platform provides not just student resources, but parent guidance at every step.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 transition-transform hover:transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">AI that Adapts & Grows</h3>
              <p className="text-gray-600">
                Unlike static practice tests, our AI-powered system learns your child's strengths and challenges, 
                adjusting in real-time to provide the perfect level of challenge and targeted feedback.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 transition-transform hover:transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">Community-Centered</h3>
              <p className="text-gray-600">
                We're constantly evolving based on community feedback. The insights and experiences of 
                students and parents shape our platform, creating a resource that truly serves your needs.
              </p>
            </div>
          </div>
        </div>

        {/* The Journey Continues */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12 mb-24">
          <div className="md:w-1/2">
            <Image 
              src="/images/students-celebrating.jpg" 
              width={600} 
              height={400} 
              alt="Students celebrating success" 
              className="rounded-xl shadow-lg"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Journey Continues</h2>
            <p className="text-lg text-gray-700 mb-4">
              What began as one parent's solution has grown into a platform serving thousands of Victorian 
              families. Every success story—every student who gains confidence, masters a difficult concept, 
              or achieves their dream of selective school entry—adds a new chapter to our story.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Today, Smart Practise combines cutting-edge AI technology with the heart and understanding of 
              parents who've walked this path. We're more than a practice platform—we're a community of 
              families supporting each other toward educational excellence.
            </p>
            <p className="text-lg text-gray-700">
              And we're just getting started. Join us as we continue to innovate, inspire, and illuminate 
              the path to selective school success.
            </p>
          </div>
        </div>

        {/* Testimonials 
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Voices from Our Community</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
              <svg className="w-10 h-10 text-blue-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-gray-700 italic mb-6">
                "Smart Practise transformed our approach to exam preparation. The personalized feedback helped 
                identify my daughter's strengths and weaknesses, allowing us to focus our efforts where they were 
                most needed. She's now thriving at Melbourne High School!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">MH</span>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Melissa Huang</p>
                  <p className="text-sm text-gray-500">Parent of Year 8 student</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
              <svg className="w-10 h-10 text-blue-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-gray-700 italic mb-6">
                "As a teacher and a parent, I appreciate the depth and quality of Smart Practise's materials. 
                The questions are challenging yet accessible, and the adaptive technology ensures students are 
                always working at the edge of their abilities—exactly where real growth happens."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">DP</span>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">David Patel</p>
                  <p className="text-sm text-gray-500">Math Teacher & Parent</p>
                </div>
              </div>
            </div>
          </div>
        </div>*/}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Join Our Community of Achievers</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Start your child's journey to selective school success with personalized, AI-powered practice that grows with them.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/register"
              className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/contact"
              className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}