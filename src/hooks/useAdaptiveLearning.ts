// src/hooks/useAdaptiveLearning.ts
import { useState, useEffect, useCallback } from 'react';
import { QuizQuestionResult, LearningGap, Recommendation, UseAdaptiveLearningProps } from '@/types/quiz';

export const useAdaptiveLearning = ({
  enableAdaptiveLearning,
  userId,
  apiEndpoints,
  subjectType, // Keep for potential future use or logging
}: UseAdaptiveLearningProps): {
  adaptiveLearningEnabled: boolean;
  adaptiveRecommendations: Recommendation[];
  learningGaps: LearningGap[];
  processAdaptiveFeedback: (
    testAttemptId: number | null,
    questionId: number,
    isCorrect: boolean,
    timeSpent: number
  ) => Promise<boolean | undefined>;
  processFinalAdaptiveFeedback: (
    testAttemptId: number | null,
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
            console.warn(`[${subjectType}] Failed to fetch adaptive settings, using default`);
          }
        } else {
          // Graceful fallback
          setAdaptiveLearningEnabled(enableAdaptiveLearning);
          console.warn(`[${subjectType}] Error fetching adaptive settings, using default`);
        }
      } catch (error) {
        // Default to using whatever was passed in props
        setAdaptiveLearningEnabled(enableAdaptiveLearning);
        console.error(`[${subjectType}] Exception in fetching adaptive settings:`, error);
      }
    };
  
    fetchAdaptiveSettings();
  }, [userId, enableAdaptiveLearning, apiEndpoints.adaptiveSettings, subjectType]);

  // Process adaptive feedback for a single question
  const processAdaptiveFeedback = useCallback(async (
    testAttemptId: number | null,
    questionId: number,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<boolean | undefined> => {
    if (!testAttemptId || !adaptiveLearningEnabled) return false;
    
    try {
      const adaptivePayload = {
        testAttemptId: testAttemptId,
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
      
      if (!response.ok) {
        console.warn(`[${subjectType}] Adaptive feedback request failed`);
        return false;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLearningGaps(data.gaps || []);
        setAdaptiveRecommendations(data.recommendations || []);
        return true;
      }
      
      console.warn(`[${subjectType}] Adaptive feedback processing unsuccessful`);
      return false;
    } catch (error) {
      console.error(`[${subjectType}] Exception in processing adaptive feedback:`, error);
      return false;
    }
  }, [adaptiveLearningEnabled, apiEndpoints.adaptiveFeedback, subjectType]);

  // Process adaptive feedback for all questions at the end
  const processFinalAdaptiveFeedback = useCallback(async (
    testAttemptId: number | null,
    questions: QuizQuestionResult[]
  ): Promise<boolean> => {
    if (!testAttemptId || !adaptiveLearningEnabled || questions.length === 0) return false;
    
    try {
      console.log(`[${subjectType}] Processing final adaptive feedback:`, {
        testAttemptId,
        questionsCount: questions.length,
        correctCount: questions.filter(q => q.correctAnswer === q.userAnswer).length
      });

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
          testAttemptId: testAttemptId,
          questionResults
        })
      });
      
      if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${subjectType}] Final adaptive feedback request failed (${response.status}):`, errorText);
      
      // Special handling for perfect quiz in case of API failure
      const allCorrect = questions.every(q => q.correctAnswer === q.userAnswer);
      if (allCorrect) {
        console.warn(`[${subjectType}] API failure on perfect quiz performance - this may cause incorrect learning gaps`);
      }
      
      return false;
    }
      
      const data = await response.json();
      
      if (data.success) {
        setLearningGaps(data.gaps || []);
        setAdaptiveRecommendations(data.recommendations || []);
        return true;
      }
      
      console.warn(`[${subjectType}] Final adaptive feedback processing unsuccessful`);
      return false;
    } catch (error) {
      console.error(`[${subjectType}] Exception in processing final adaptive feedback:`, error);
      return false;
    }
  }, [adaptiveLearningEnabled, apiEndpoints.adaptiveFeedback, subjectType]);

  return {
    adaptiveLearningEnabled,
    adaptiveRecommendations,
    learningGaps,
    processAdaptiveFeedback,
    processFinalAdaptiveFeedback,
  };
};