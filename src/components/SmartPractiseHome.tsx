import React from 'react';
import { ArrowRight, Sparkles, Clock, Lock, Brain, Zap, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const SmartPractiseHome = () => {
  const handleStartVocabularyPractice = () => {
    window.location.href = '/vocabulary';
  };
  
  const handleStartQuantitativePractice = () => {
    window.location.href = '/quantitative';
  };

  const upcomingModules = [
    { title: 'Reasoning – Reading', date: 'Feb 2025' },
    { title: 'Reasoning – Mathematics', date: 'Feb 2025' },
    { title: 'General Ability – Verbal', date: 'March 2025' },
    { title: 'Writing', date: 'March 2025' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      {/* Enhanced Header */}
      <div className="max-w-7xl mx-auto px-4 py-8">      
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Now in Beta</span>
          </div>
          <h2 className="text-3xl font-bold mb-3">
            AI-Powered Comprehensive Preparation
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            for Victorian Selective Entry exams
          </p>
        </div>

        {/* Enhanced Vocabulary Practice Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-12 transform transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold">Vocabulary Practice</h3>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Beta
                </Badge>
                <Badge className="bg-green-100 text-green-800 ml-2">New!</Badge>
              </div>
              <p className="text-gray-600 mb-6">
                Master essential vocabulary through our AI-powered platform. Practice 
                definitions, synonyms, antonyms, and contextual usage with adaptive 
                learning technology.
              </p>
              <button 
                onClick={handleStartVocabularyPractice}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Start Practice
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:w-1/3">
              <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-xl">2,000+</span>
                </div>
                <p className="text-sm text-gray-600">Practice Words</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold">Adaptive</span>
                </div>
                <p className="text-sm text-gray-600">Learning Path</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="font-bold">AI-Powered</span>
                </div>
                <p className="text-sm text-gray-600">Feedback</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <span className="font-bold">Real-time</span>
                </div>
                <p className="text-sm text-gray-600">Progress Tracking</p>
              </div>
            </div>
          </div>
          {/* Progress Bar 
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Module Completion</span>
              <span className="text-sm font-medium">12%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{width: '12%'}} />
            </div>
          </div>*/}
        </div>

        {/* Added Quantitative Practice Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-12 transform transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold">Quantitative Practice</h3>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Beta
                </Badge>
                <Badge className="bg-green-100 text-green-800 ml-2">New!</Badge>
              </div>
              <p className="text-gray-600 mb-6">
                Enhance your mathematical reasoning skills with our AI-powered platform. 
                Practice numerical problem-solving, data interpretation, and pattern recognition 
                with personalized learning technology.
              </p>
              <button 
                onClick={handleStartQuantitativePractice}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Start Practice
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:w-1/3">
              <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-xl">1,500+</span>
                </div>
                <p className="text-sm text-gray-600">Practice Problems</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold">Adaptive</span>
                </div>
                <p className="text-sm text-gray-600">Learning Path</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="font-bold">AI-Powered</span>
                </div>
                <p className="text-sm text-gray-600">Feedback</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <span className="font-bold">Real-time</span>
                </div>
                <p className="text-sm text-gray-600">Progress Tracking</p>
              </div>
            </div>
          </div>
          {/* Progress Bar 
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Module Completion</span>
              <span className="text-sm font-medium">8%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{width: '8%'}} />
            </div>
          </div>*/}
        </div>

        {/* Upcoming Modules Grid */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6">Upcoming Modules</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingModules.map((module, index) => (
              <div key={index} 
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-gray-600">{module.title}</h4>
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

        {/* Beta Benefits Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-center mb-8">Beta Program Benefits</h3>
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
                icon: <Zap className="w-5 h-5 text-purple-600" />,
                title: 'Direct Support',
                description: 'Get dedicated assistance during the beta period'
              },
              {
                icon: <RefreshCw className="w-5 h-5 text-blue-600" />,
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