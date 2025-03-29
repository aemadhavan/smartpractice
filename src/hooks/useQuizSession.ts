// src/hooks/useQuizSession.ts
import { useState, useRef, useCallback } from 'react';
import { QuizQuestion, AttemptData, SessionManager } from '@/types/quiz';

interface UseQuizSessionProps {
  userId: string;
  questions: QuizQuestion[];
  sessionManager: SessionManager;
  apiEndpoints: {
    initSession: string;
    trackAttempt: string;
    completeSession: string;
  };
  subjectType: string;
  onTestAttemptIdUpdate?: (testAttemptId: number | null) => void;
}

export const useQuizSession = ({
  userId,
  questions,
  sessionManager,
  apiEndpoints,
  subjectType,
  onTestAttemptIdUpdate,
}: UseQuizSessionProps) => {
  const [currentTestAttemptId, setCurrentTestAttemptId] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const sessionInitializationRef = useRef<boolean>(false);

  const initSession = useCallback(async (retryCount = 0) => {
    if (questions.length === 0 || sessionInitializationRef.current) return;
    
    try {
      sessionInitializationRef.current = true;
      
      const testAttemptId = await sessionManager.initSession(
        userId,
        questions[0].subtopicId,
        apiEndpoints.initSession,
        retryCount
      );
      
      if (testAttemptId) {
        setCurrentTestAttemptId(testAttemptId);
        if (onTestAttemptIdUpdate) {
          onTestAttemptIdUpdate(testAttemptId);
        }
        return testAttemptId;
      } else {
        setInitError('Failed to initialize session');
        return null;
      }
    } catch (error) {
      if (retryCount < 3) {
        setTimeout(() => initSession(retryCount + 1), 1000);
        return null;
      }
      setInitError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }, [questions, userId, apiEndpoints.initSession, sessionManager, onTestAttemptIdUpdate]);

  const trackAttempt = useCallback(async (attemptData: AttemptData): Promise<boolean> => {
    if (!currentTestAttemptId) return false;
    const validatedData = {
      ...attemptData,
      testAttemptId: currentTestAttemptId,
      userId: userId // Ensure userId is consistent
    };

    try {
      await sessionManager.trackAttempt(
        validatedData,
        apiEndpoints.trackAttempt
      );
      return true;
    } catch (error) {
      console.error(`[${subjectType}] Error submitting answer:`, error);
      return false;
    }
  }, [currentTestAttemptId, apiEndpoints.trackAttempt, sessionManager, subjectType, userId]);

  const completeSession = useCallback(async (userId: string, testAttemptId: number | null, endpoint: string): Promise<boolean> => {
    if (!testAttemptId) return false;
    
    try {
      const completed = await sessionManager.completeSession(
        userId,
        testAttemptId,
        endpoint
      );
      
      if (completed) {
        sessionInitializationRef.current = false;
        setCurrentTestAttemptId(null);
      }
      
      return completed;
    } catch (error) {
      console.error(`[${subjectType}] Error completing session:`, error);
      return false;
    }
  }, [sessionManager, subjectType]);

  return {
    currentTestAttemptId,
    initError,
    initSession,
    trackAttempt,
    completeSession,
  };
};