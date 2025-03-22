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
  onSessionIdUpdate?: (sessionId: number | null) => void;
}

export const useQuizSession = ({
  userId,
  questions,
  sessionManager,
  apiEndpoints,
  subjectType,
  onSessionIdUpdate,
}: UseQuizSessionProps) => {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const sessionInitializationRef = useRef<boolean>(false);

  const initSession = useCallback(async (retryCount = 0) => {
    if (questions.length === 0 || sessionInitializationRef.current) return;
    
    try {
      sessionInitializationRef.current = true;
      
      const sessionId = await sessionManager.initSession(
        userId,
        questions[0].subtopicId,
        apiEndpoints.initSession,
        retryCount
      );
      
      if (sessionId) {
        setCurrentSessionId(sessionId);
        if (onSessionIdUpdate) {
          onSessionIdUpdate(sessionId);
        }
        return sessionId;
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
  }, [questions, userId, apiEndpoints.initSession, sessionManager, onSessionIdUpdate]);

  const trackAttempt = useCallback(async (attemptData: AttemptData): Promise<boolean> => {
    if (!currentSessionId) return false;
    
    try {
      await sessionManager.trackAttempt(
        attemptData,
        apiEndpoints.trackAttempt
      );
      return true;
    } catch (error) {
      console.error(`[${subjectType}] Error submitting answer:`, error);
      return false;
    }
  }, [currentSessionId, apiEndpoints.trackAttempt, sessionManager, subjectType]);

  const completeSession = useCallback(async (userId: string, sessionId: number | null, endpoint: string): Promise<boolean> => {
    if (!sessionId) return false;
    
    try {
      const completed = await sessionManager.completeSession(
        userId,
        sessionId,
        endpoint
      );
      
      if (completed) {
        sessionInitializationRef.current = false;
        setCurrentSessionId(null);
      }
      
      return completed;
    } catch (error) {
      console.error(`[${subjectType}] Error completing session:`, error);
      return false;
    }
  }, [sessionManager, subjectType]);

  return {
    currentSessionId,
    initError,
    initSession,
    trackAttempt,
    completeSession,
  };
};