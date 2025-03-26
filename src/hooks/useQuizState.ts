// src/hooks/useQuizState.ts
import { useState, useCallback } from 'react';
import { 
  QuizQuestion, 
  QuizQuestionResult, 
  AttemptData,
  UseQuizStateProps 
} from '@/types/quiz';

export const useQuizState = ({
  questions,
  userId,
  topicId,
  currentSessionId,
  trackAttempt,
  completeSession,
  onQuestionsUpdate,
  calculateNewStatus,
  apiEndpoints,
  subjectType,
}: UseQuizStateProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showQuizSummary, setShowQuizSummary] = useState(false);
  const [results, setResults] = useState<{
    correctCount: number;
    totalCount: number;
    questions: QuizQuestionResult[];
  }>({
    correctCount: 0,
    totalCount: 0,
    questions: []
  });

  // Default status calculation function
  const defaultCalculateNewStatus = (
    question: QuizQuestion, 
    isCorrect: boolean, 
    newSuccessRate: number
  ): 'Mastered' | 'Learning' | 'To Start' => {
    if (isCorrect) {
      if (question.status === 'To Start') return 'Learning';
      if (question.status === 'Learning' && newSuccessRate >= 70) return 'Mastered';
    } else {
      if (question.status === 'Mastered') return 'Learning';
      if (question.status === 'Learning' && newSuccessRate < 40) return 'To Start';
    }
    return question.status;
  };

  // Check answer function
  const checkAnswer = useCallback(async () => {
    if (!selectedOption || isAnswerSubmitted || !questions[currentQuestionIndex]) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // Find the selected option and its text value
    const selectedOptionObj = currentQuestion.options.find(opt => opt.id === selectedOption);
    const selectedOptionValue = selectedOptionObj?.text || '';
    
    const isCorrect = selectedOptionValue === currentQuestion.correctAnswer;
    
    setIsAnswerSubmitted(true);
    setIsAnswerCorrect(isCorrect);
    
    setResults(prev => ({
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      totalCount: prev.totalCount + 1,
      questions: [
        ...prev.questions,
        {
          ...currentQuestion,
          userAnswer: selectedOptionValue
        }
      ]
    }));
    
    const timeSpent = 0; // This would come from timer
    
    if (currentSessionId) {
      const attemptData: AttemptData = {
        userId,
        questionId: currentQuestion.id,
        topicId,
        subtopicId: currentQuestion.subtopicId,
        isCorrect,
        userAnswer: selectedOptionValue,
        timeSpent
      };
      await trackAttempt(attemptData);
    }
  }, [
    selectedOption,
    isAnswerSubmitted,
    questions,
    currentQuestionIndex,
    userId,
    topicId,
    currentSessionId,
    trackAttempt
  ]);

  // Next question function
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex === questions.length - 1) {
      setIsQuizCompleted(true);
      setShowQuizSummary(false);
      return;
    }
    
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsAnswerCorrect(false);
    setContentLoading(true);
  }, [currentQuestionIndex, questions.length]);

  // Complete quiz function
  const completeQuiz = useCallback(async () => {
    setShowQuizSummary(true);
    
    // Calculate updated questions
    const updatedQuestions = questions.map((question, index) => {
      if (index < results.questions.length) {
        const resultQuestion = results.questions[index];
        const isCorrect = resultQuestion.correctAnswer === resultQuestion.userAnswer;
        
        const totalAttempts = question.attemptCount + 1;
        const oldSuccessCount = Math.round(question.successRate * question.attemptCount / 100);
        const newSuccessCount = oldSuccessCount + (isCorrect ? 1 : 0);
        const newSuccessRate = totalAttempts > 0 
          ? (newSuccessCount / totalAttempts) * 100 
          : 0;
        
        const newStatus = calculateNewStatus 
          ? calculateNewStatus(question, isCorrect, newSuccessRate)
          : defaultCalculateNewStatus(question, isCorrect, newSuccessRate);
        
        return {
          ...question,
          status: newStatus,
          attemptCount: totalAttempts,
          successRate: newSuccessRate
        };
      }
      
      return question;
    });
    
    // Update questions in parent
    if (onQuestionsUpdate) {
      try {
        onQuestionsUpdate(updatedQuestions);
      } catch (error) {
        console.error(`[${subjectType}] Error updating questions:`, error);
      }
    }
    
    // Complete the session
    if (currentSessionId) {
      await completeSession(userId, currentSessionId, apiEndpoints.completeSession);
    }
  }, [
    questions,
    results,
    calculateNewStatus,
    onQuestionsUpdate,
    currentSessionId,
    userId,
    apiEndpoints.completeSession,
    subjectType,
    completeSession
  ]);

  return {
    currentQuestionIndex,
    selectedOption,
    isAnswerSubmitted,
    isAnswerCorrect,
    results,
    isQuizCompleted,
    showQuizSummary,
    contentLoading,
    setSelectedOption,
    setContentLoading,
    checkAnswer,
    nextQuestion,
    completeQuiz,
    setShowQuizSummary,
  };
};