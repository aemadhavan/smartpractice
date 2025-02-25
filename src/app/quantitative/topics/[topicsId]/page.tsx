// File: src/app/quantitative/topics/[topicId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

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

type Question = {
  id: number;
  question: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  attemptCount: number;
  successRate: number;
  status: 'Mastered' | 'Learning' | 'To Start';
};

type TopicDetail = {
  id: number;
  name: string;
  description: string;
};

type TopicData = {
  topic: TopicDetail;
  subtopics: Subtopic[];
  stats: {
    totalQuestions: number;
    attemptedCount: number;
    masteredCount: number;
    masteryLevel: number;
  };
};

const TopicDetailPage = () => {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const { topicId } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [activeSubtopic, setActiveSubtopic] = useState<number | null>(null);

  const fetchTopicData = useCallback(async () => {
    if (!user?.id || !topicId) return;
    
    try {
      setLoading(true);
      //const response = await fetch(`/api/quantitative/${topicId}?userId=${user.id}`);
      const response = await fetch(`/api/quantitative/${topicId}?userId=${user.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Topic not found');
        }
        throw new Error('Failed to fetch topic data');
      }
      
      const data = await response.json();
      console.log("Fetched topic data:", data); // Debug log
      setTopicData(data);
      
      // Set the first subtopic as active if there are subtopics
      if (data.subtopics && data.subtopics.length > 0) {
        setActiveSubtopic(data.subtopics[0].id);
      }
    } catch (err) {
      console.error('Error fetching topic data:', err);
      setError('Error loading topic data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, topicId]);

  useEffect(() => {
    if (isLoaded) {
      fetchTopicData();
    }
  }, [isLoaded, fetchTopicData]);

  const handleSubtopicClick = (subtopicId: number) => {
    setActiveSubtopic(subtopicId);
  };

  // Function to get difficulty label based on ID
  const getDifficultyLabel = (id: number) => {
    switch (id) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      case 4: return 'Very Hard';
      default: return 'Unknown';
    }
  };

  // Function to get question type label based on ID
  const getQuestionTypeLabel = (id: number) => {
    switch (id) {
      case 1: return 'Multiple Choice';
      case 2: return 'Fill in the Blank';
      case 3: return 'True/False';
      case 4: return 'Short Answer';
      default: return 'Other';
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2">Loading subtopic data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please sign in to access quantitative practice.</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push('/quantitative')}
        >
          Back to Topics
        </button>
      </div>
    );
  }

  if (error || !topicData) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error || 'Failed to load topic data'}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push('/quantitative')}
        >
          Back to Topics
        </button>
      </div>
    );
  }

  const { topic, subtopics, stats } = topicData;
  const activeSubtopicData = subtopics.find(s => s.id === activeSubtopic) || null;

  return (
    <div className="p-6 bg-white max-w-6xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/quantitative">
          <button className="flex items-center text-blue-600">
            <span className="mr-1">←</span> Back to Topics
          </button>
        </Link>
      </div>

      {/* Topic header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{topic.name}</h1>
        <p className="text-gray-600">{topic.description}</p>
      </div>

      {/* Topic stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-700">Total Questions</div>
          <div className="text-2xl font-bold text-blue-800">{stats.totalQuestions}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-700">Attempted</div>
          <div className="text-2xl font-bold text-blue-800">{stats.attemptedCount}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-700">Mastered</div>
          <div className="text-2xl font-bold text-green-800">{stats.masteredCount}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-700">Mastery Level</div>
          <div className="text-2xl font-bold text-purple-800">{stats.masteryLevel}%</div>
        </div>
      </div>

      {/* Subtopics and questions section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subtopics list */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Subtopics</h2>
          <div className="space-y-2">
            {subtopics.map(subtopic => (
              <div 
                key={subtopic.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  activeSubtopic === subtopic.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleSubtopicClick(subtopic.id)}
              >
                <div className="font-medium">{subtopic.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {subtopic.stats.total} questions
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-green-600">{subtopic.stats.mastered} mastered</span>
                  <span className="text-yellow-600">{subtopic.stats.learning} learning</span>
                  <span className="text-gray-600">{subtopic.stats.toStart} to start</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            {activeSubtopicData ? `Questions: ${activeSubtopicData.name}` : 'Questions'}
          </h2>
          
          {activeSubtopicData ? (
            <>
              <p className="text-gray-600 mb-4">{activeSubtopicData.description}</p>
              
              {activeSubtopicData.questions.length > 0 ? (
                <div className="space-y-3">
                  {activeSubtopicData.questions.map(question => (
                    <div 
                      key={question.id}
                      className={`p-4 border rounded-lg ${
                        question.status === 'Mastered' ? 'border-green-200 bg-green-50' :
                        question.status === 'Learning' ? 'border-yellow-200 bg-yellow-50' :
                        'border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{question.question}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 rounded">
                          {getDifficultyLabel(question.difficultyLevelId)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 rounded">
                          {getQuestionTypeLabel(question.questionTypeId)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {question.timeAllocation}s
                        </span>
                      </div>
                      
                      <div className="mt-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className={`
                            ${question.status === 'Mastered' ? 'text-green-600' : 
                              question.status === 'Learning' ? 'text-yellow-600' : 
                              'text-gray-600'}
                          `}>
                            {question.status}
                          </span>
                          <span className="text-gray-500">
                            {question.attemptCount > 0 ? 
                              `${Math.round(question.successRate * 100)}% success (${question.attemptCount} attempts)` : 
                              'Not attempted'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              question.status === 'Mastered' ? 'bg-green-500' :
                              question.status === 'Learning' ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${Math.round(question.successRate * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No questions available for this subtopic.</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Select a subtopic to view questions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicDetailPage;