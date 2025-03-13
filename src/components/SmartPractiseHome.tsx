import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Lock, 
  Brain, 
  Zap, 
  RefreshCw, 
  BookOpen,
  Edit3,
  Calculator,
  MessageSquare,
  Star,
  Headphones,
  RotateCw
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

const SmartPractiseHome = () => {
  const handleStartPractice = (area: string) => {
    window.location.href = `/${area.toLowerCase()}`;
  };

  const upcomingModules = [
    { title: 'Reasoning – Reading', date: 'March 2025' },
    { title: 'Reasoning – Mathematics', date: 'March 2025' },
    { title: 'General Ability – Verbal', date: 'March 2025' },
    { title: 'Writing', date: 'March 2025' }
  ];

  const testimonials = [
    {
      quote: "Smart Practise helped my daughter gain confidence in all exam areas. The personalized approach made a huge difference!",
      author: "Sarah M.",
      role: "Parent of Year 8 student"
    },
    {
      quote: "The practice questions are very similar to the actual exam. My son improved dramatically in just two months of using this platform.",
      author: "David L.",
      role: "Parent of successful applicant"
    },
    {
      quote: "As a teacher, I recommend Smart Practise to all my students preparing for selective schools. The AI-powered feedback is exceptional.",
      author: "Jennifer K.",
      role: "Education Consultant"
    }
  ];

  const faqs = [
    {
      question: "When is the Victorian Selective Entry High School exam held?",
      answer: "The Victorian Selective Entry High School exam is typically held in June or July each year. For Year 9 entry, students in Year 8 take the exam to secure a place in the following year. The exact date can vary slightly from year to year, but generally, it occurs in mid-June. "
    },
    {
      question: "How does your platform help with exam preparation?",
      answer: "Our platform provides comprehensive practice materials for all five exam categories, with AI-powered feedback, adaptive learning paths, and real-time progress tracking."
    },
    {
      question: "How long before the exam should my child start preparing?",
      answer: "We recommend starting preparation at least 6-12 months before the exam to allow sufficient time to develop skills and confidence across all test areas."
    },
    {
      question: "Do you offer personalized study plans?",
      answer: "Yes, our AI technology creates personalized study plans based on your child's strengths and areas for improvement, adapting as they progress."
    },
    {
      question: "Can I track my child's progress?",
      answer: "Absolutely. Our platform provides detailed progress reports and analytics to help you monitor improvement over time."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">      
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-10 items-center mb-12">
          {/* Left side - Main content */}
          <div className="lg:w-1/2">
            <h1 className="text-4xl font-bold mb-4">
              AI-Powered Preparation
            </h1>
            <h2 className="text-3xl font-bold mb-4">
              for Selective Entry High School Exam 
              {/* Victorian */}
            </h2>
            <p className="text-gray-600 mb-8">
              Comprehensive practice resources designed specifically for Year 8 students preparing for the June exam. Master all five exam categories and gain entry to Melbourne's elite selective schools.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              {/* <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button> */}
              {/* <button className="group inline-flex items-center gap-2 border border-blue-500 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-all">
                Explore Practice Areas
              </button> */}
              <Link href="/practice-areas" className="group inline-flex items-center gap-2 border border-blue-500 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-all"> Explore Practice Areas</Link>
            </div>
            <div className="flex items-center mb-8">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                ))}
              </div>
              <span className="ml-3 text-sm text-gray-600">Join thousands of students preparing for success</span>
            </div>
            
            {/* Practice area pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {['Vocabulary','Reading', 'Writing', 'Verbal', 'Quantitative', 'Mathematics'].map((area) => (
                <button key={area} className="px-6 py-2 bg-white rounded-full text-gray-700 text-sm font-medium shadow-sm hover:shadow transition-all">
                  {area}
                </button>
              ))}
            </div>
          </div>
          
          {/* Right side - Demo card */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Reading Comprehension</h3>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
              </div>
              
              {/* Question content */}
              <div className="mb-8">
                <p className="text-gray-700 mb-4">
                  Read the passage and answer the following questions about the author's main argument and supporting evidence.
                </p>
                
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <p className="text-gray-700 mb-3">The author primarily suggests that environmental conservation efforts should focus on:</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border border-gray-300 mr-3"></div>
                      <span>Urban planning initiatives</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border border-gray-300 mr-3"></div>
                      <span>Individual consumer choices</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border border-gray-300 bg-blue-600 mr-3 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                      <span>Corporate responsibility</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border border-gray-300 mr-3"></div>
                      <span>Government regulation</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation buttons */}
              <div className="flex justify-between">
                <button className="px-4 py-2 text-gray-600 text-sm font-medium">
                  Previous Question
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  Next Question
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-8 mb-16">
          <div className="flex-1 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Adaptive Learning</h3>
              <p className="text-gray-600 text-sm">Personalized to your learning needs</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-start gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">AI-Powered Feedback</h3>
              <p className="text-gray-600 text-sm">Instant, detailed assessment</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Progress Tracking</h3>
              <p className="text-gray-600 text-sm">Monitor improvement in real-time</p>
            </div>
          </div>
        </div>

        {/* Main Practice Areas */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-6">Comprehensive Exam Preparation</h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-12">
            Master all five exam categories with our specialized practice modules designed specifically for the Victorian Selective Entry High School exam.
          </p>
        </div>
        {/* Quantitative Reasoning Module */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-12 transform transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">                
                <Calculator className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold">Quantitative Reasoning</h3>
                <Badge className="bg-green-100 text-green-800 ml-2">New!</Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-gray-600 mb-6">
                Master the art of problem-solving with our comprehensive Quantitative Reasoning module. With over 100+ practice problems and AI-powered feedback, you'll be ready for any challenge.
              </p>
              <button 
                onClick={() => handleStartPractice('quantitative')}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Start Practice
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:w-1/3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">355+</span>
                <span className="text-gray-600">Practice Problems</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">AI-Powered Feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Real-time Progress Tracking</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">Adaptive Learning Path</div>
              </div>
            </div>
          </div>
        </div>
        {/* Mathematical Reasoning Module */}
        
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-12 transform transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold">Mathematical Reasoning</h3>
                <Badge className="bg-green-100 text-green-800 ml-2">New!</Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-gray-600 mb-6">
                Develop critical mathematical reasoning skills with our AI-powered platform. Practice numerical problem-solving, data interpretation, and pattern recognition with adaptive learning technology.
              </p>
              <button 
                onClick={() => handleStartPractice('maths')}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Start Practice
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:w-1/3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">1,200+</span>
                <span className="text-gray-600">Practice Problems</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">AI-Powered Feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Real-time Progress Tracking</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">Adaptive Learning Path</div>
              </div>
            </div>
          </div>
        </div>
        {/* Vocabulary Module */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-12 transform transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold">Vocabulary</h3>
                <Badge className="bg-green-100 text-green-800 ml-2">New!</Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-gray-600 mb-6">
                Expand your vocabulary with our AI-powered platform. Practice word definitions, synonyms, and antonyms with personalized learning technology.
              </p>
              <button 
                onClick={() => handleStartPractice('vocabulary')}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Start Practice
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:w-1/3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">2,000+</span>
                <span className="text-gray-600">Practice Words</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">AI-Powered Feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Real-time Progress Tracking</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">Adaptive Learning Path</div>
              </div>
            </div>
          </div>
        </div> 

        {/* Verbal Reasoning Module */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-12 transform transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row gap-8"></div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold">Verbal Reasoning</h3>
              <Badge className="bg-green-100 text-green-800 ml-2">New!</Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Beta
              </Badge>
            </div>
            <p className="text-gray-600 mb-6">
              Enhance your verbal reasoning skills with our AI-powered platform. Practice word definitions, analogies, and logical reasoning with personalized learning technology.
            </p>
            <button 
              // onClick={() => handleStartPractice('verbal')}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Start Practice soon
              {/* <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> */}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1"></div>
            <div className="flex flex-col gap-4 lg:w-1/3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">1,500+</span>
                <span className="text-gray-600">Practice Problems</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">AI-Powered Feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Real-time Progress Tracking</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">Adaptive Learning Path</div>
              </div>
            </div>
          </div>
        </div>                    

        {/* Reading Comprehension Module */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-12 transform transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold">Reading Comprehension</h3>
                <Badge className="bg-green-100 text-green-800 ml-2">New!</Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-gray-600 mb-6">
                Develop critical reading skills with our AI-powered platform. Practice text analysis, inference, and comprehension with adaptive learning technology.
              </p>
              <button 
                onClick={() => handleStartPractice('reading')}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Start Practice soon
                {/* <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> */}
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:w-1/3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">1,500+</span>
                <span className="text-gray-600">Practice Passages</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">AI-Powered Feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Real-time Progress Tracking</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">Adaptive Learning Path</div>
              </div>
            </div>
          </div>
        </div>

        {/* Writing Skills Module */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-12 transform transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Edit3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold">Writing Skills</h3>
                <Badge className="bg-green-100 text-green-800 ml-2">New!</Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-gray-600 mb-6">
                Enhance your writing abilities with structured practice. Learn essay structure, creative writing, and persuasive techniques with personalized feedback.
              </p>
              <button 
                onClick={() => handleStartPractice('writing')}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Start Practice soon
                {/* <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> */}
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:w-1/3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">500+</span>
                <span className="text-gray-600">Writing Prompts</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">AI-Powered Feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Real-time Progress Tracking</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-full"></div>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">Adaptive Learning Path</div>
              </div>
            </div>
          </div>
        </div>       

        {/* Upcoming Modules Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-6">Upcoming Modules</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingModules.map((module, index) => (
              <div key={index} 
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-gray-700">{module.title}</h4>
                  <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-500" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Coming {module.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials / Success Stories 
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Success Stories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from parents and students who achieved their goals with Smart Practise.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>*/}

        {/* CTA Banner */}
        <div className="bg-blue-600 text-white rounded-2xl p-12 mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Excel in Your Selective Entry Exam?</h2>
          <p className="mb-8 max-w-3xl mx-auto">
            Join thousands of students who have successfully prepared for and passed the Victorian Selective Entry High School exam.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-all">
              Start Free Trial
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all">
              Learn More
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our platform and the Victorian Selective Entry exam.
            </p>
          </div>
          <div className="space-y-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h4 className="text-lg font-medium mb-2">{faq.question}</h4>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Beta Benefits Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">Beta Program Benefits</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Sparkles className="w-5 h-5 text-blue-600" />,
                title: 'Early Access',
                description: 'Be among the first to try new features and learning tools'
              },
              {
                icon: <Brain className="w-5 h-5 text-indigo-600" />,
                title: 'Priority Features',
                description: 'Your feedback shapes our development priorities'
              },
              {
                icon: <Headphones className="w-5 h-5 text-purple-600" />,
                title: 'Direct Support',
                description: 'Get dedicated assistance during the beta period'
              },
              {
                icon: <RotateCw className="w-5 h-5 text-blue-600" />,
                title: 'Regular Updates',
                description: 'Frequent improvements based on user feedback'
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-white/80 backdrop-blur p-6 rounded-xl hover:bg-white transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h4 className="font-semibold mb-2">{benefit.title}</h4>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPractiseHome;