'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

type Question = {
  id: number;
  subtopicId: number;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  attemptCount: number;
  successRate: number;
  status: string;
};

type Subtopic = {
  id: number;
  name: string;
  description: string;
  questions: Question[];
  stats: {
    total: number;
    mastered: number;
    learning: number;
    toStart: number;
  };
};

type TopicData = {
  topic: {
    id: number;
    name: string;
    description: string;
  };
  subtopics: Subtopic[];
  stats: {
    totalQuestions: number;
    attemptedCount: number;
    masteredCount: number;
    masteryLevel: number;
  };
};

// This is a client component that uses the params object differently
export default function MathTopicPage({ params }: { params: { topicId: string } }) {
  const router = useRouter();
  const pathParams = useParams(); // Use the hook instead of the prop
  const { user, isLoaded } = useUser();
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  // Use the useParams hook result which is safe to use in client components
  const topicId = pathParams.topicId as string || params.topicId;

  const fetchTopicData = useCallback(async (force = false) => {
    if (!user?.id) return;
    
    // Skip fetch if data is cached and not forced
    if (
      !force && 
      topicData && 
      lastFetched && 
      Date.now() - lastFetched < CACHE_TIME
    ) {
      return;
    }
    
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/maths/${topicId}?userId=${user.id}&_=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTopicData(data);
      setLastFetched(Date.now());
    } catch (err) {
      setError(`${err instanceof Error ? err.message : 'Error loading topic data'}. Please try again later.`);
      console.error('Error fetching topic data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, topicData, lastFetched, topicId]);

  useEffect(() => {
    if (isLoaded) {
      fetchTopicData();
    }
  }, [isLoaded, fetchTopicData]);

  // Loading state with skeleton UI
  if (!isLoaded || loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        {/* Back button skeleton */}
        <div className="mb-4 h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        
        {/* Title skeleton */}
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Stats skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 p-4 rounded-lg">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Subtopics heading skeleton */}
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
        
        {/* Subtopic card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 shadow-sm">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full mb-3"></div>
              <div className="flex justify-between mb-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-full bg-blue-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please sign in to access math practice.</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => fetchTopicData(true)}
        >
          Try Again
        </button>
      </div>
    );
  }

  // No data
  if (!topicData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No data available for this topic.</p>
        <button 
          onClick={() => router.push('/maths')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Topics
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white max-w-6xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/maths">
          <button className="flex items-center text-blue-600 hover:text-blue-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Topics
          </button>
        </Link>
      </div>

      {/* Topic header with refresh button */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{topicData.topic.name}</h1>
          <p className="text-gray-600 mt-2">{topicData.topic.description}</p>
        </div>
        <button 
          onClick={() => fetchTopicData(true)}
          className="p-2 text-blue-600 hover:text-blue-800"
          title="Refresh data"
          aria-label="Refresh data"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>

      {/* Topic stats in grid layout, similar to quantitative */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-700">Total Questions</div>
          <div className="text-2xl font-bold text-blue-800">{topicData.stats.totalQuestions}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-700">Mastered</div>
          <div className="text-2xl font-bold text-green-800">{topicData.stats.masteredCount}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-orange-700">Learning</div>
          <div className="text-2xl font-bold text-orange-800">{topicData.stats.attemptedCount - topicData.stats.masteredCount}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-700">To Start</div>
          <div className="text-2xl font-bold text-purple-800">{topicData.stats.totalQuestions - topicData.stats.attemptedCount}</div>
        </div>
      </div>

      {/* Overall mastery progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-700">Overall Mastery</span>
          <span className="text-sm text-gray-700">{topicData.stats.masteryLevel}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-500 h-2.5 rounded-full"
            style={{ width: `${topicData.stats.masteryLevel}%` }}
          ></div>
        </div>
      </div>

      {/* Subtopics in card layout, similar to quantitative */}
      <h2 className="text-xl font-semibold mb-4">Subtopics</h2>
      
      {topicData.subtopics.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-yellow-800">
          No subtopics available for this topic yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {topicData.subtopics.map((subtopic) => (
            <div 
              key={subtopic.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="font-medium text-lg mb-2">{subtopic.name}</div>
              <div className="text-sm text-gray-600 mb-3">
                {subtopic.stats.total} questions
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${(subtopic.stats.mastered / Math.max(subtopic.stats.total, 1)) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs mb-4">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  <span>{subtopic.stats.mastered} mastered</span>
                </span>
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
                  <span>{subtopic.stats.learning} learning</span>
                </span>
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-gray-400 mr-1"></span>
                  <span>{subtopic.stats.toStart} to start</span>
                </span>
              </div>
              
              <Link href={`/maths/${topicId}/${subtopic.id}/practice`}>
                <button className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Practice Now
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {/* Debug information in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Debug Information</h3>
          <div className="text-xs text-gray-700">
            <p>Total subtopics: {topicData.subtopics.length}</p>
            <p>Total questions: {topicData.stats.totalQuestions}</p>
            <p>Data last fetched: {lastFetched ? new Date(lastFetched).toLocaleTimeString() : 'Never'}</p>
            <p>Topic ID: {topicId}</p>
          </div>
        </div>
      )}
    </div>
  );
}