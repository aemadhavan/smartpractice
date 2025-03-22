// src/components/QuizPage.tsx
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';
import MathFormula from '../math/MathFormula';

// Custom hooks
import { useQuizSession } from '@/hooks/useQuizSession';
import { useQuizTimer } from '@/hooks/useQuizTimer';
import { useQuizState } from '@/hooks/useQuizState';
import { useAdaptiveLearning as useAdaptiveHook } from '@/hooks/useAdaptiveLearning';

// Components
import QuizHeader from './QuizHeader';
import QuizProgress from './QuizProgress';
import QuizQuestion from './QuizQuestion';
import QuizOptions from './QuizOptions';
import QuizActions from './QuizActions';
import QuizFeedback from './QuizFeedback';
import QuizLoading from './QuizLoading';
import QuizError from './QuizError';

// Types
import {
  Option,
  QuizQuestion as QuizQuestionType,
  QuizQuestionResult,
  ApiEndpoints,
  QuizPageProps,
  QuizSummaryProps,
  LearningGap,
  Recommendation,
  AttemptData
} from '@/types/quiz';

const QuizPage: React.FC<QuizPageProps> = ({
  subtopicName,
  questions,
  userId,
  topicId,
  onQuestionsUpdate,
  onSessionIdUpdate,
  apiEndpoints,
  calculateNewStatus,
  subjectType,
  useAdaptiveLearning = true,
  sessionManager,
  QuizSummaryComponent,
  renderers,
}) => {
  const router = useRouter();
  
  // Use custom hooks to manage state and side effects
  const {
    currentSessionId,
    initError,
    initSession,
    trackAttempt,
    completeSession,
  } = useQuizSession({
    userId,
    questions,
    sessionManager,
    apiEndpoints,
    subjectType,
    onSessionIdUpdate,
  });

  const {
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
  } = useQuizState({
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
  });

  const {
    timeLeft,
    isPaused,
    timeSpentOnQuestion,
    togglePause,
    startTimer,
    resetTimer,
  } = useQuizTimer({
    defaultTime: questions[currentQuestionIndex]?.timeAllocation || 60,
    onTimeUp: () => {
      if (selectedOption && !isAnswerSubmitted) {
        checkAnswer();
      }
    },
    isActive: !isAnswerSubmitted,
  });

  const {
    adaptiveLearningEnabled,
    adaptiveRecommendations,
    learningGaps,
    processAdaptiveFeedback,
    processFinalAdaptiveFeedback,
  } = useAdaptiveHook({
    enableAdaptiveLearning: useAdaptiveLearning, // Changed from useAdaptiveLearning to enableAdaptiveLearning
    userId,
    apiEndpoints,
    subjectType,
  });

  // Memoize current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => 
    questions[currentQuestionIndex] || null, 
    [questions, currentQuestionIndex]
  );
  const [sessionManuallyEnded, setSessionManuallyEnded] = useState(false);
  // Initialize session on component mount
  React.useEffect(() => {
    if (questions.length > 0 && !currentSessionId && !sessionManuallyEnded) {
      initSession();
    }
  }, [questions, initSession, currentSessionId,sessionManuallyEnded]);
  
  // Update timer when question changes
  React.useEffect(() => {
    if (currentQuestion) {
      resetTimer(currentQuestion.timeAllocation);
      startTimer();
      setContentLoading(true);
    }
  }, [currentQuestion, resetTimer, startTimer, setContentLoading]);
  
  // Provide a safety fallback for content display
  React.useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (contentLoading) {
        setContentLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(fallbackTimer);
  }, [currentQuestionIndex, contentLoading, setContentLoading]);

  // Handle option selection
  const handleOptionSelect = React.useCallback((optionId: string) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionId);
    }
  }, [isAnswerSubmitted, setSelectedOption]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Go back to topics page
  const goBackToTopics = React.useCallback(() => {
    if (currentSessionId) {
      setSessionManuallyEnded(true); // Set flag before ending session
      completeSession(userId, currentSessionId, apiEndpoints.completeSession)
        .then(() => {
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
          router.push(`/${subjectType}/topics/${topicId}`);
        })
        .catch(() => {
          router.push(`/${subjectType}/topics/${topicId}`);
        });
    } else {
      router.push(`/${subjectType}/topics/${topicId}`);
    }
  }, [
    completeSession,
    userId,
    currentSessionId,
    apiEndpoints.completeSession,
    router,
    subjectType,
    topicId,
    onSessionIdUpdate
  ]);

  // Handle quiz completion and show summary
  const handleCompleteQuiz = React.useCallback(async () => {
    try {
      if (typeof processFinalAdaptiveFeedback === 'function') {
        await processFinalAdaptiveFeedback(currentSessionId, results.questions);
      }
    } catch (error) {
      console.error("Error processing adaptive feedback:", error);
    }
    setShowQuizSummary(true);
  }, [
    processFinalAdaptiveFeedback, 
    currentSessionId, 
    results.questions, 
    setShowQuizSummary
  ]);

  // Render adaptive recommendations
  const renderAdaptiveRecommendations = React.useCallback(() => {
    if (!adaptiveLearningEnabled || adaptiveRecommendations.length === 0) {
      return null;
    }
  
    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Adaptive Learning Suggestion</h4>
        </div>
        <div className="text-sm text-blue-700">
          {adaptiveRecommendations[0].message}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          {adaptiveRecommendations[0].action}
        </div>
      </div>
    );
  }, [adaptiveLearningEnabled, adaptiveRecommendations]);

  // Prepare quiz summary content
  const quizSummaryContent = (
    <QuizSummaryComponent 
      questions={results.questions}
      correctCount={results.correctCount}
      onBackToTopics={goBackToTopics}
      moduleTitle={subtopicName}
      testAttemptId={currentSessionId ?? undefined}
      subjectType={subjectType}
      learningGaps={learningGaps}
      adaptiveRecommendations={adaptiveRecommendations}
      adaptiveLearningEnabled={adaptiveLearningEnabled}
    />
  );

  // Error state
  if (initError) {
    return (
      <QuizError 
        errorMessage={initError} 
        onBackToTopics={goBackToTopics} 
      />
    );
  }
  
  // Loading state
  if (!currentQuestion) {
    return <QuizLoading />;
  }

  // Render quiz summary if quiz is completed
  if (isQuizCompleted && showQuizSummary) {
    return quizSummaryContent;
  }

  // Main quiz render
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <div className="p-4 flex items-center">
        <button 
          onClick={goBackToTopics}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Topics
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        {!isQuizCompleted ? (
          <div className="p-6">
            <QuizHeader 
              subtopicName={subtopicName} 
              currentIndex={currentQuestionIndex} 
              totalQuestions={questions.length} 
            />
            
            <QuizProgress 
              currentIndex={currentQuestionIndex} 
              totalQuestions={questions.length} 
            />
            
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-3 py-1 rounded ${
                  timeLeft > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                } font-medium text-sm`}>
                  Time: {formatTime(timeLeft)}
                </span>
                <button
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  onClick={togglePause}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                {adaptiveLearningEnabled && (
                  <div className="inline-flex items-center text-xs gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                    <Brain className="h-3 w-3" />
                    <span>Adaptive</span>
                  </div>
                )}
              </div>
              <span className={`inline-block px-3 py-1 rounded ${
                currentQuestion.status === 'Mastered' ? 'bg-green-100 text-green-800' :
                currentQuestion.status === 'Learning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              } font-medium text-sm`}>
                {currentQuestion.status}
              </span>
            </div>
            
            <QuizQuestion
              question={currentQuestion.question}
              renderer={renderers.questionRenderer}
              loading={contentLoading}
            />
            
            <QuizOptions
              options={currentQuestion.options}
              selectedOption={selectedOption}
              isAnswerSubmitted={isAnswerSubmitted}
              correctAnswer={currentQuestion.correctAnswer}
              onOptionSelect={handleOptionSelect}
              loading={contentLoading}
              renderer={renderers.optionTextRenderer}
            />

            <QuizActions
              isAnswerSubmitted={isAnswerSubmitted}
              selectedOption={selectedOption}
              loading={contentLoading}
              correctCount={results.correctCount}
              answeredCount={results.totalCount}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
              onCheckAnswer={checkAnswer}
              onNextQuestion={nextQuestion}
            />
            
            {isAnswerSubmitted && currentQuestion.formula && !contentLoading && (
              <div className="formula-container mt-4 mb-5 p-4 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                <div className="text-sm text-blue-700 mb-2 font-medium">Formula:</div>
                <div className="formula-display overflow-x-auto">
                  <MathFormula 
                    formula={currentQuestion.formula} 
                    className="text-lg block" 
                    style={{ margin: '0 auto' }}
                    hideUntilTypeset="first"
                  />
                </div>
              </div>
            )}

            {isAnswerSubmitted && (
              <QuizFeedback 
                isCorrect={isAnswerCorrect}
                explanation={currentQuestion.explanation}
                renderer={renderers.mathJaxRenderer}
                adaptiveRecommendations={renderAdaptiveRecommendations()}
              />
            )}                        
          </div>
        ) : (
          <div className="p-6">
            {/* Quiz completed summary */}
            <div className="text-center py-6">
              <h3 className="text-xl font-semibold mb-4">Quiz Completed!</h3>
              <p className="mb-6">
                You scored {results.correctCount} out of {questions.length} questions.
              </p>
              <div className="text-lg font-medium mb-2">
                {(results.correctCount / questions.length) * 100 >= 80
                  ? 'Great job! 🎉'
                  : (results.correctCount / questions.length) * 100 >= 60
                  ? 'Good effort! 👍'
                  : 'Keep practicing! 💪'}
              </div>
              <button
                onClick={handleCompleteQuiz}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                View Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;