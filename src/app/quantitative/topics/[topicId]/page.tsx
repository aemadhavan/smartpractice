// File: src/app/quantitative/topics/[topicId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import QuizModal, { QuizQuestion } from '@/components/QuizModal';

type Option = {
  id: string;
  text: string;
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

type Question = {
  id: number;
  question: string;
  options: string | Record<string, unknown> | unknown[]; // Replace any with more specific types
  correctOption: string;
  explanation: string;
  formula?: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  attemptCount: number;
  successRate: number;
  status: 'Mastered' | 'Learning' | 'To Start';
  subtopicId?: number; // Add this to match QuizQuestion
};

type ProcessedQuestion = Omit<Question, 'options'> & {
  id: number;
  question: string;
  options: Option[];
  correctOption: string;
  explanation: string;
  formula?: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  attemptCount: number;
  successRate: number;
  status: 'Mastered' | 'Learning' | 'To Start';
  subtopicId: number; // Make sure this is required to match QuizQuestio
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
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedSubtopicForQuiz, setSelectedSubtopicForQuiz] = useState<Subtopic | null>(null);
  const [processedQuestions, setProcessedQuestions] = useState<ProcessedQuestion[]>([]);
  // Track current test session
  const [currentTestSessionId, setCurrentTestSessionId] = useState<number | null>(null);

  // Ref to track if test session needs to be completed on unmount
  const needsCompletionRef = useRef(false);

  const fetchTopicData = useCallback(async (): Promise<void> => {
    if (!user?.id || !topicId) return;
    
    try {
      setLoading(true);
      
      // Add cache-busting parameter to prevent browser caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/quantitative/${topicId}?userId=${user.id}&_=${timestamp}`, {
        // Add headers to prevent caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Topic not found');
        }
        throw new Error('Failed to fetch topic data');
      }
      
      const data = await response.json();
      console.log("Fetched topic data with timestamp:", timestamp, data);
      
      // Log key stats for debugging
      if (data.subtopics) {
        data.subtopics.forEach((subtopic: Subtopic) => {
          const masteredCount = subtopic.stats.mastered;
          const totalQuestions = subtopic.stats.total;
          console.log(`Subtopic ${subtopic.name}: ${masteredCount}/${totalQuestions} mastered`);
          
          // Log status of each question
          subtopic.questions.forEach((q: Question) => {
            console.log(`Question ${q.id}: status=${q.status}, successRate=${q.successRate}, attempts=${q.attemptCount}`);
          });
        });
      }
      
      setTopicData(data);
    } catch (err) {
      console.error('Error fetching topic data:', err);
      setError('Error loading topic data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, topicId]);
  
  // Function to complete test session
  const completeTestSession = useCallback(async (sessionId: number) => {
    if (!sessionId || !user?.id) return;
    
    try {
      console.log('Completing test session:', sessionId);
      
      const response = await fetch('/api/quantitative/complete-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testSessionId: sessionId,
          userId: user.id
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Successfully completed test session:', result);
        return true;
      } else {
        console.error('Failed to complete test session:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error completing test session:', error);
      return false;
    }
  }, [user?.id]);

  // Effect to ensure test session completion when the component unmounts
  useEffect(() => {
    return () => {
      if (needsCompletionRef.current && currentTestSessionId) {
        // We're unmounting and there's an active session to complete
        completeTestSession(currentTestSessionId).then(() => {
          console.log(`Test session ${currentTestSessionId} completed on unmount`);
        });
      }
    };
  }, [currentTestSessionId, completeTestSession]);

  useEffect(() => {
    if (isLoaded) {
      fetchTopicData();
    }
  }, [isLoaded, fetchTopicData]);

  // Helper function to normalize an option to match the Option type
  const normalizeOption = (opt: unknown): Option => {
    if (typeof opt === 'string') {
      // Clean up the string - remove any leading/trailing quotes and whitespace
      const cleanString = opt.trim().replace(/^["']|["']$/g, '');
      return { id: cleanString, text: cleanString };
    }
    
    if (typeof opt !== 'object' || opt === null) {
      const str = String(opt).trim();
      return { id: str, text: str };
    }
    
    // At this point opt is a non-null object
    const option = opt as Record<string, unknown>;
    const id = String(option.id || option.value || Math.random()).trim();
    const text = String(option.text || option.label || option.id || option.value || '').trim();
    return { id, text };
  };
  const parseOptionsString = (optionsStr: string): Option[] => {
    // Handle empty or undefined input
    if (!optionsStr || optionsStr.trim() === '') {
      return [];
    }
    
    // Special case: Check if this is an array with unquoted currency values
    // Format like: [$37,500,$39,062.50,$41,250,$43,750]
    if (optionsStr.includes('[') && 
        optionsStr.includes(']') && 
        optionsStr.includes('$') && 
        !optionsStr.includes('"')) {
      
      console.log('Detected unquoted currency array format');
      
      // Extract the content between brackets
      const content = optionsStr.substring(
        optionsStr.indexOf('[') + 1,
        optionsStr.lastIndexOf(']')
      ).trim();
      
      // First, normalize the format by adding quotes around currency values
      // Convert [$37,500,$39,062.50] to ["$37,500","$39,062.50"]
      const fixedContent = content
        .replace(/\$(\d+,\d+(?:\.\d+)?)/g, '"$$$1"')
        .replace(/\$(\d+(?:\.\d+)?)/g, '"$$$1"');
      
      console.log('Normalized content:', fixedContent);
      
      try {
        // Try to parse the fixed content
        const parsed = JSON.parse(`[${fixedContent}]`);
        console.log('Successfully parsed fixed content:', parsed);
        return parsed.map((item: any) => ({ 
          id: String(item), 
          text: String(item)
        }));
      } catch (fixError) {
        console.log('Failed to parse fixed content:', fixError);
      }
    }
    
    // Try standard JSON parse first
    try {
      const parsed = JSON.parse(optionsStr);
      
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({ 
          id: String(item), 
          text: String(item) 
        }));
      } else if (parsed && typeof parsed === 'object') {
        return Object.values(parsed).map(item => ({ 
          id: String(item), 
          text: String(item) 
        }));
      } else if (typeof parsed === 'string') {
        // Try to parse the string as JSON again in case it's double-stringified
        try {
          const nestedParse = JSON.parse(parsed);
          if (Array.isArray(nestedParse)) {
            return nestedParse.map(item => ({ 
              id: String(item), 
              text: String(item) 
            }));
          }
        } catch (nestedError) {
          // If nested parsing fails, return the string as a single option
          return [{ id: parsed, text: parsed }];
        }
      }
    } catch (jsonError) {
      console.log('Standard JSON parse failed:', jsonError);
    }
    
    // Last resort: Try to handle string with currency values
    if (optionsStr.includes('$') && optionsStr.includes(',')) {
      // This pattern will match currency values like $37,500.00
      const currencyRegex = /\$\d+(?:,\d+)*(?:\.\d+)?/g;
      const matches = optionsStr.match(currencyRegex);
      
      if (matches && matches.length > 0) {
        console.log('Extracted currency values:', matches);
        return matches.map(value => ({ id: value, text: value }));
      }
    }
    
    // If all parsing attempts fail, split by comma as last resort
    // but only if it doesn't look like it's splitting a currency value
    if (optionsStr.includes(',') && !optionsStr.match(/\$\d+,\d+/)) {
      return optionsStr.split(',')
        .map(opt => opt.trim())
        .filter(Boolean)
        .map(opt => ({ id: opt, text: opt }));
    }
    
    // If nothing works, return as single option
    return [{ id: optionsStr, text: optionsStr }];
  };
  const logOptionsFormat = (question: Question): void => {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.log(`------- QUESTION ${question.id} OPTIONS DEBUG -------`);
    console.log('Options type:', typeof question.options);
    console.log('Options value:', question.options);
    
    if (typeof question.options === 'string') {
      console.log('First 100 chars:', question.options.substring(0, 100));
      console.log('Contains quotes:', question.options.includes('"'));
      console.log('Contains brackets:', question.options.includes('[') && question.options.includes(']'));
      console.log('Contains dollar sign:', question.options.includes('$'));
      console.log('Contains comma:', question.options.includes(','));
      
      if (question.options.includes('$') && question.options.includes(',')) {
        console.log('Likely has currency values with commas');
        
        // Test pattern for values like $37,500
        const currencyPattern = /\$\d+,\d+/;
        console.log('Currency pattern match:', currencyPattern.test(question.options));
      }
    }
    
    console.log('-----------------------------------------------');
  };
  const initializeTestSession = async (subtopicId: number): Promise<number | null> => {
    if (!user?.id) return null;
    
    try {
      console.log('Initializing test session for subtopic:', subtopicId);
      
      const response = await fetch('/api/quantitative/init-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          subtopicId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Successfully initialized test session:', result);
        return result.testAttemptId;
      } else {
        console.error('Failed to initialize test session:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error initializing test session:', error);
      return null;
    }
  };

  const handleStartQuiz = async (subtopic: Subtopic): Promise<void> => {
    // Process questions to ensure options are properly parsed
    const processed = subtopic.questions.map((question: Question) => {
      logOptionsFormat(question);
      let parsedOptions: Option[] = [];
      
      try {
        console.log(`Processing options for question ${question.id}:`, question.options);
        
        // When options come from the database, they might be in several formats
        if (typeof question.options === 'string') {
          parsedOptions = parseOptionsString(question.options);
        } else if (Array.isArray(question.options)) {
          // If it's already an array, map each item
          parsedOptions = question.options.map(normalizeOption);
        } else if (question.options && typeof question.options === 'object') {
          // If it's an object with key-value pairs
          parsedOptions = Object.values(question.options as Record<string, unknown>)
            .map(normalizeOption);
        }
        
        // Ensure we have some options
        if (parsedOptions.length === 0 && question.correctOption) {
          // If we have a correct option but no parsed options, include at least the correct one
          const correctOpt = String(question.correctOption).trim();
          parsedOptions = [{ id: correctOpt, text: correctOpt }];
          
          // For numeric answers, could add some variations
          if (!isNaN(Number(correctOpt))) {
            const correctNum = Number(correctOpt);
            const options = [
              correctNum - 2,
              correctNum - 1,
              correctNum,
              correctNum + 1
            ].map(num => ({ id: String(num), text: String(num) }));
            
            // Shuffle to avoid having the correct answer always in the same position
            parsedOptions = options;
          }
        }
        
        // Ensure options are unique and properly formatted
        const uniqueOptions = new Map<string, Option>();
        parsedOptions.forEach(opt => {
          const id = String(opt.id).trim();
          if (id && !uniqueOptions.has(id)) {
            uniqueOptions.set(id, { 
              id, 
              text: String(opt.text).trim() || id 
            });
          }
        });
        
        parsedOptions = Array.from(uniqueOptions.values());
        
        // If we still have no options, provide a fallback
        if (parsedOptions.length === 0) {
          parsedOptions = [{ id: "option1", text: "No options available" }];
        }
        
      } catch (e) {
        console.error('Error processing options for question', question.id, e);
        parsedOptions = [{ id: "error", text: "Error loading options" }];
      }
      
      return {
        ...question,
        subtopicId: subtopic.id,
        correctOption: String(question.correctOption || "").trim(),
        options: parsedOptions
      };
    });
    
    // Continue with the rest of the function...
    console.log("Processed questions:", processed);
    setProcessedQuestions(processed);
    setSelectedSubtopicForQuiz({
      ...subtopic,
      questions: processed
    });
    
    // Rest of the function remains the same
    // Reset test session ID and mark for completion
    setCurrentTestSessionId(null);
    needsCompletionRef.current = false;
  
    // Initialize a test session before opening the quiz modal
    const sessionId = await initializeTestSession(subtopic.id);
    console.log('Initialized session ID:', sessionId);
    setCurrentTestSessionId(sessionId);
    
    // Mark the session for completion if it was created successfully
    if (sessionId) {
      needsCompletionRef.current = true;
    }
    
    // Open the quiz modal
    setIsQuizModalOpen(true);
  };

  // Add this function to handle updating questions
  const handleQuestionsUpdate = (updatedQuestions: ProcessedQuestion[]): void => {
    console.log('Updating questions with new data:', updatedQuestions);
    setProcessedQuestions(updatedQuestions);
    
    // Also update the selectedSubtopicForQuiz
    if (selectedSubtopicForQuiz) {
      setSelectedSubtopicForQuiz({
        ...selectedSubtopicForQuiz,
        questions: updatedQuestions 
      });
    }
  };

  // Handler to receive test session ID from the QuizModal
  const handleSessionIdUpdate = (sessionId: number | null): void => {
    console.log('Received test session ID update:', sessionId);
    if (sessionId) {
      setCurrentTestSessionId(sessionId);
      needsCompletionRef.current = true; // This session will need completion
    }
  };

  const questionUpdateAdapter = (updatedQuestions: QuizQuestion[]): void => {
    // This adapter function converts from QuizQuestion[] to ProcessedQuestion[]
    handleQuestionsUpdate(updatedQuestions as unknown as ProcessedQuestion[]);
  };

  // Update the handleCloseQuizModal function to complete the session
  const handleCloseQuizModal = async (): Promise<void> => {
    // Complete the test session if one exists
    if (currentTestSessionId) {
      try {
        await completeTestSession(currentTestSessionId);
        // Reset after completion
        needsCompletionRef.current = false;
        setCurrentTestSessionId(null);
      } catch (error) {
        console.error('Error completing test session on close:', error);
      }
    }
    
    // Close the modal
    setIsQuizModalOpen(false);
    
    // Refresh topic data after closing
    console.log('Refreshing topic data after quiz completion');
    fetchTopicData().then(() => {
      console.log('Topic data refreshed');
      setSelectedSubtopicForQuiz(null);
      setProcessedQuestions([]);
    });
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

      {/* Subtopics section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Subtopics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {subtopics.map((subtopic: Subtopic) => (
            <div 
              key={subtopic.id}
              className="p-3 border rounded-lg cursor-pointer transition-colors border-gray-200 hover:bg-gray-50"
              onClick={() => handleStartQuiz(subtopic)}
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
              <button 
                className="w-full mt-3 px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStartQuiz(subtopic);
                }}
              >
                Practice Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Modal */}
      {selectedSubtopicForQuiz && (
        <QuizModal
          isOpen={isQuizModalOpen}
          onClose={handleCloseQuizModal}
          subtopicName={selectedSubtopicForQuiz.name}
          questions={processedQuestions as unknown as QuizQuestion[]}
          userId={user.id}
          topicId={topic.id}
          onQuestionsUpdate={questionUpdateAdapter}
          onSessionIdUpdate={handleSessionIdUpdate}
          testSessionId={currentTestSessionId}
        />
      )}
      
      {/* Debug information in development mode */}
      {process.env.NODE_ENV === 'development' && currentTestSessionId && (
        <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-700 rounded">
          Current test session: {currentTestSessionId} 
          {needsCompletionRef.current ? ' (pending completion)' : ' (no completion needed)'}
        </div>
      )}
    </div>
  );
};

export default TopicDetailPage;