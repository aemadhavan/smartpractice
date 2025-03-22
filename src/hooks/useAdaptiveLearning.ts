// src/hooks/useAdaptiveLearning.ts
import { useState, useEffect, useCallback } from 'react';
import { QuizQuestionResult, LearningGap, Recommendation, UseAdaptiveLearningProps } from '@/types/quiz';

export const useAdaptiveLearning = ({
  enableAdaptiveLearning, // Renamed from useAdaptiveLearning to avoid naming conflict
  userId,
  apiEndpoints,
  subjectType,
}: UseAdaptiveLearningProps): {
  adaptiveLearningEnabled: boolean;
  adaptiveRecommendations: Recommendation[];
  learningGaps: LearningGap[];
  processAdaptiveFeedback: (
    sessionId: number | null,
    questionId: number,
    isCorrect: boolean,
    timeSpent: number
  ) => Promise<boolean | undefined>;
  processFinalAdaptiveFeedback: (
    sessionId: number | null,
    questions: QuizQuestionResult[]
  ) => Promise<boolean>;
} => {
  const [adaptiveLearningEnabled, setAdaptiveLearningEnabled] = useState(enableAdaptiveLearning);
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<Recommendation[]>([]);
  const [learningGaps, setLearningGaps] = useState<LearningGap[]>([]);

  // Fetch adaptive learning settings
  useEffect(() => {
    const fetchAdaptiveSettings = async () => {
      if (!userId) return;
  
      try {
        const response = await fetch(apiEndpoints.adaptiveSettings);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            setAdaptiveLearningEnabled(data.settings.enableAdaptiveLearning);
          } else {
            // Fall back to default
            setAdaptiveLearningEnabled(enableAdaptiveLearning);
          }
        } else {
          // Graceful fallback
          setAdaptiveLearningEnabled(enableAdaptiveLearning);
        }
      } catch (error) {
        // Default to using whatever was passed in props
        setAdaptiveLearningEnabled(enableAdaptiveLearning);
      }
    };
  
    fetchAdaptiveSettings();
  }, [userId, enableAdaptiveLearning, apiEndpoints.adaptiveSettings]);

  // Process adaptive feedback for a single question
  const processAdaptiveFeedback = useCallback(async (
    sessionId: number | null,
    questionId: number,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<boolean | undefined> => {
    if (!sessionId || !adaptiveLearningEnabled) return false;
    
    try {
      const adaptivePayload = {
        testAttemptId: sessionId,
        questionResults: [{
          questionId,
          isCorrect,
          timeSpent
        }]
      };
      
      const response = await fetch(apiEndpoints.adaptiveFeedback, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adaptivePayload)
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      
      if (data.success) {
        setLearningGaps(data.gaps || []);
        setAdaptiveRecommendations(data.recommendations || []);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }, [adaptiveLearningEnabled, apiEndpoints.adaptiveFeedback]);

  // Process adaptive feedback for all questions at the end
  const processFinalAdaptiveFeedback = useCallback(async (
    sessionId: number | null,
    questions: QuizQuestionResult[]
  ): Promise<boolean> => {
    if (!sessionId || !adaptiveLearningEnabled || questions.length === 0) return false;
    
    try {
      const questionResults = questions.map(q => ({
        questionId: q.id,
        isCorrect: q.correctAnswer === q.userAnswer,
        timeSpent: 0 // Time spent not tracked per question in this context
      }));
      
      const response = await fetch(apiEndpoints.adaptiveFeedback, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testAttemptId: sessionId,
          questionResults
        })
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      
      if (data.success) {
        setLearningGaps(data.gaps || []);
        setAdaptiveRecommendations(data.recommendations || []);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }, [adaptiveLearningEnabled, apiEndpoints.adaptiveFeedback]);

  return {
    adaptiveLearningEnabled,
    adaptiveRecommendations,
    learningGaps,
    processAdaptiveFeedback,
    processFinalAdaptiveFeedback,
  };
};