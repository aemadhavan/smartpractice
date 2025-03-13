'use client';

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductAreas() {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const productAreas = [
    {
      id: 'vocabulary',
      name: 'Vocabulary',
      description: 'Build word power and language skills essential for comprehension and expression.',
      icon: '/images/vocabulary-icon.svg',
      color: 'bg-blue-100',
      hoverColor: 'bg-blue-200',
      borderColor: 'border-blue-300',
      skills: ['Word meanings', 'Synonyms & antonyms', 'Context clues', 'Word families']
    },
    {
      id: 'reading',
      name: 'Reading',
      description: 'Develop critical analysis and comprehension of various text types.',
      icon: '/images/reading-icon.svg',
      color: 'bg-emerald-100',
      hoverColor: 'bg-emerald-200',
      borderColor: 'border-emerald-300',
      skills: ['Text analysis', 'Author\'s purpose', 'Main ideas & details', 'Inference']
    },
    {
      id: 'writing',
      name: 'Writing',
      description: 'Master structured responses and creative writing techniques.',
      icon: '/images/writing-icon.svg',
      color: 'bg-purple-100',
      hoverColor: 'bg-purple-200',
      borderColor: 'border-purple-300',
      skills: ['Essay structure', 'Creative writing', 'Persuasive techniques', 'Grammar & syntax']
    },
    {
      id: 'maths',
      name: 'Mathematics',
      description: 'Strengthen problem-solving skills across all key mathematical domains.',
      icon: '/images/mathematics-icon.svg',
      color: 'bg-amber-100',
      hoverColor: 'bg-amber-200',
      borderColor: 'border-amber-300',
      skills: ['Number & algebra', 'Geometry', 'Data & statistics', 'Problem solving']
    },
    {
      id: 'verbal',
      name: 'Verbal',
      description: 'Enhance verbal reasoning and logical thinking skills.',
      icon: '/images/verbal-icon.svg',
      color: 'bg-red-100',
      hoverColor: 'bg-red-200',
      borderColor: 'border-red-300',
      skills: ['Analogies', 'Logical reasoning', 'Verbal comprehension', 'Critical thinking']
    },
    {
      id: 'quantitative',
      name: 'Quantitative',
      description: 'Develop advanced numerical reasoning and data interpretation abilities.',
      icon: '/images/quantitative-icon.svg',
      color: 'bg-indigo-100',
      hoverColor: 'bg-indigo-200',
      borderColor: 'border-indigo-300',
      skills: ['Numerical reasoning', 'Data interpretation', 'Patterns & sequences', 'Quantitative comparison']
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Practice Areas | Smart Practise</title>
        <meta name="description" content="Explore our comprehensive practice areas for Victorian Selective Entry High School Exam preparation" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Practice Areas</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master all five exam categories with our comprehensive AI-powered practice resources
            designed specifically for Victorian Selective Entry High School Exam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {productAreas.map((area) => (
            <div
              key={area.id}
              className={`rounded-xl ${area.color} border ${area.borderColor} p-6 transition-all duration-300 ${
                hoveredArea === area.id ? `${area.hoverColor} shadow-lg -translate-y-1` : 'shadow'
              }`}
              onMouseEnter={() => setHoveredArea(area.id)}
              onMouseLeave={() => setHoveredArea(null)}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow">
                  {/* Replace with actual icon component or image */}
                  <div className="text-2xl">{area.name.charAt(0)}</div>
                </div>
                <h2 className="ml-4 text-2xl font-semibold text-gray-900">{area.name}</h2>
              </div>
              
              <p className="text-gray-700 mb-4">{area.description}</p>
              
              <div className="mb-5">
                <h3 className="font-medium text-gray-900 mb-2">Key Skills:</h3>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {area.skills.map((skill, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Link 
                href={`/${area.id}`}
                className="inline-block w-full text-center py-2 px-4 bg-white text-blue-600 font-medium rounded-lg shadow-sm hover:bg-blue-50 transition-colors duration-200"
              >
                Explore {area.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-8">How Our Practice System Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Adaptive Learning</h3>
              <p className="text-gray-600">Questions adjust to your skill level, focusing on areas that need improvement.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Feedback</h3>
              <p className="text-gray-600">Receive instant, detailed assessment that helps you understand your mistakes.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-600">Monitor your improvement in real-time with detailed analytics and insights.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Ready to excel in your exam?</h2>
          <Link 
            href="/register"
            className="inline-block py-3 px-8 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            Start Practicing Now
          </Link>
        </div>
      </main>
    </div>
  );
}