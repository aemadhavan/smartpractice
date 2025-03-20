'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

type Topic = {
  id: number;
  name: string;
  description: string;
  problems: number;
  masteryPercentage: number;
  hasAttempted: boolean;
  hasNewContent: boolean;
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  totalProblems: number;
  masteredCount: number;
  dailyGoal: number;
  dailyProgress: number;
};

const MathsPage = () => {
  const { user, isLoaded } = useUser();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProblems: 0,
    masteredCount: 0,
    dailyGoal: 20,
    dailyProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/maths?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch math topics');
      }
      
      setTopics(data.topics);
      setStats(data.stats);
    } catch (err) {
      setError('Error loading topics. Please try again later.');
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) {
      fetchTopics();
    }
  }, [isLoaded, fetchTopics]);

  if (!isLoaded || loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2">Loading topics...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please sign in to access mathematical practice.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => fetchTopics()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mathematical Practice</h1>
      
      {/* Practice button 
      <div className="mb-6">
        <Link href="/maths/practice">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50">
            <span className="mr-2">📝</span>
            Practice
          </button>
        </Link>
      </div>*/}
      
      {/* Stats section */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 bg-blue-50 p-4 rounded-lg flex items-center">
          <div className="text-blue-600 text-2xl mr-3">📊</div>
          <div>
            <div className="text-2xl font-bold text-blue-800">{stats.totalProblems}</div>
            <div className="text-sm text-blue-700">Total Problems</div>
          </div>
        </div>
        
        <div className="flex-1 bg-green-50 p-4 rounded-lg flex items-center">
          <div className="text-green-600 text-2xl mr-3">🏆</div>
          <div>
            <div className="text-2xl font-bold text-green-800">{stats.masteredCount}</div>
            <div className="text-sm text-green-700">Mastered</div>
          </div>
        </div>
        
        <div className="flex-1 bg-purple-50 p-4 rounded-lg flex items-center">
          <div className="text-purple-600 text-lg mr-3">🎯</div>
          <div className="w-full">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-purple-700">Daily Goal</span>
              <span className="text-sm text-purple-700">{stats.dailyProgress}/{stats.dailyGoal}</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ width: `${(stats.dailyProgress / stats.dailyGoal) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Topic selection */}
      <h2 className="text-xl font-semibold mb-4">Select a Topic</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <Link 
            href={`/maths/topics/${topic.id}`} 
            key={topic.id}
          >
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col hover:shadow-md cursor-pointer relative h-full">
              {/* Red dot indicator for new content */}
              {topic.hasNewContent && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
              
              <div className="text-lg font-bold mb-1">{topic.name}</div>
              <div className="text-sm text-gray-600 mb-2">{topic.problems} problems</div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-auto">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${topic.masteryPercentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-right mt-1 text-gray-500">
                {topic.hasAttempted ? `${topic.masteryPercentage}% mastered` : 'Not started'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MathsPage;