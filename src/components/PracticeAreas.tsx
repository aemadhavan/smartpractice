import React from 'react';
import { ArrowRight, Sparkles, Clock, Lock, Bell, Star, Zap, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const PracticeAreas = () => {
  const handleStartPractice = () => {
    window.location.href = '/vocabulary';
  };

  const upcomingModules = [
    { title: 'Reasoning – Reading', status: 'coming-soon', date: 'Feb 2025' },
    { title: 'Reasoning – Mathematics', status: 'coming-soon', date: 'Feburary 2025' },
    { title: 'General Ability – Verbal', status: 'coming-soon', date: 'March 2025' },
    { title: 'General Ability – Quantitative', status: 'coming-soon', date: 'March 2025' },
    { title: 'Writing', status: 'coming-soon', date: 'March 2025' }
  ];

  const betaBenefits = [
    {
      icon: <Star className="w-5 h-5" />,
      title: 'Early Access',
      description: 'Be among the first to try new features and learning tools'
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Priority Features',
      description: 'Your feedback shapes our development priorities'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Direct Support',
      description: 'Get dedicated assistance during the beta period'
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: 'Regular Updates',
      description: 'Frequent improvements based on user feedback'
    }
  ];

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Smart Practise</h1>
        <p className="text-xl text-gray-600">
          AI Powered Comprehensive preparation for Victorian Selective Entry exams
        </p>
      </div>

      {/* Active Module - Vocabulary Practice */}
      <div className="mb-16">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-8 hover:border-blue-300 transition-colors">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold">Vocabulary Practice</h2>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-gray-600 mb-6">
                Master essential vocabulary through our AI-powered platform. Practice definitions, 
                synonyms, antonyms, and contextual usage with adaptive learning technology.
              </p>
              <button 
                onClick={handleStartPractice}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Practice
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:w-1/3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-1">2,000+</h3>
                <p className="text-sm text-gray-600">Practice Words</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-1">Adaptive</h3>
                <p className="text-sm text-gray-600">Learning Path</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-1">AI-Powered</h3>
                <p className="text-sm text-gray-600">Feedback</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-1">Real-time</h3>
                <p className="text-sm text-gray-600">Progress Tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Modules */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Upcoming Modules</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingModules.map((module, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-600">{module.title}</h3>
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Coming {module.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Beta Benefits */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-8 text-center">Beta Program Benefits</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {betaBenefits.map((benefit, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                {benefit.icon}
              </div>
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticeAreas;