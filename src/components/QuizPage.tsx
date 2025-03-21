// src/components/QuizPage.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';
import MathFormula from './MathFormula';

// Generic types for quiz components
export type Option = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
  formula?: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  attemptCount: number;
  successRate: number;
  status: 'Mastered' | 'Learning' | 'To Start';
  subtopicId: number;
};
export type QuizQuestionResult = QuizQuestion & {
  userAnswer: string;
};


// API endpoints configuration
export interface ApiEndpoints {
  initSession: string;
  trackAttempt: string;
  completeSession: string;
  adaptiveFeedback: string;
  adaptiveSettings: string;
}

export interface LearningGap {
  id: number;
  subtopicId: number;
  conceptDescription: string;
  severity: number;
  status: string;
}

export interface Recommendation {
  type: string;
  message: string;
  action: string;
}

// QuizPage props
export type QuizPageProps = {
  subtopicName: string;
  questions: QuizQuestion[];
  userId: string;
  topicId: number;
  onQuestionsUpdate?: (questions: QuizQuestion[]) => void;
  onSessionIdUpdate?: (sessionId: number | null) => void;
  testSessionId?: number | null;
  apiEndpoints: ApiEndpoints;
  renderFormula?: (formula: string) => React.ReactNode;
  calculateNewStatus?: (
    question: QuizQuestion, 
    isCorrect: boolean, 
    successRate: number
  ) => 'Mastered' | 'Learning' | 'To Start';
  subjectType: 'maths' | 'quantitative';
  useAdaptiveLearning?: boolean;
  sessionManager: {
    initSession: (userId: string, subtopicId: number, initSessionEndpoint: string, retryCount?: number) => Promise<number | null>;
    trackAttempt: (attemptData: {
      userId: string;
      questionId: number;
      topicId: number;
      subtopicId: number;
      isCorrect: boolean;
      userAnswer: string;
      timeSpent: number;
  }, trackAttemptEndpoint: string) => Promise<void>;
    completeSession: (userId: string, sessionId: number, completeSessionEndpoint: string) => Promise<boolean>;
  };
  QuizSummaryComponent: React.ComponentType<QuizSummaryProps>;
  renderers: {
    optionTextRenderer?: (text: string | Option | null | undefined) => React.ReactNode;
    questionRenderer: (content: string) => React.ReactNode;
    mathJaxRenderer: (content: string) => React.ReactNode;
  };
};

// Type for QuizSummary component
export type QuizSummaryProps = {
  questions: QuizQuestionResult[];
  correctCount: number;
  onBackToTopics: () => void;
  onTryAgain?: () => void;
  moduleTitle?: string;
  testAttemptId?: number;
  subjectType?: 'maths' | 'quantitative';
  topicId?: number;
  subtopicId?: number;
  learningGaps?: LearningGap[];
  adaptiveRecommendations?: Recommendation[]; 
  adaptiveLearningEnabled?: boolean;
};

const QuizPage: React.FC<QuizPageProps> = ({
  subtopicName,
  questions,
  userId,
  topicId,
  onQuestionsUpdate,
  onSessionIdUpdate,
  testSessionId,
  apiEndpoints,
  calculateNewStatus,
  subjectType,
  useAdaptiveLearning = true,
  sessionManager,
  QuizSummaryComponent,
  renderers,
}) => {
  const router = useRouter();
  
  // State management (similar to previous implementation)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [results, setResults] = useState<{
    correctCount: number;
    totalCount: number;
    questions: QuizQuestionResult[];
  }>({
    correctCount: 0,
    totalCount: 0,
    questions: []
  });
  
  // Session and quiz completion state
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showQuizSummary, setShowQuizSummary] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const [adaptiveLearningEnabled, setAdaptiveLearningEnabled] = useState(useAdaptiveLearning);
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<Recommendation[]>([]);
  const [learningGaps, setLearningGaps] = useState<LearningGap[]>([]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeSpentOnQuestion, setTimeSpentOnQuestion] = useState<number>(0);
  
  // UI state
  const [contentLoading, setContentLoading] = useState(true);
  
  // Session initialization ref
  const sessionInitializationRef = useRef<boolean>(false);
  
  // Memoize current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => 
    questions[currentQuestionIndex] || null, 
    [questions, currentQuestionIndex]
  );

  // Debugging: Log time spent on each question during development
useEffect(() => {
  if (isAnswerSubmitted || isPaused || timeSpentOnQuestion === 0) return;

  console.log(`Time spent on current question (${currentQuestionIndex + 1}): ${timeSpentOnQuestion} seconds`);
}, [isAnswerSubmitted, isPaused, timeSpentOnQuestion, currentQuestionIndex]);

  // Initialize session when component mounts
  useEffect(() => {
    if (questions.length === 0 || currentSessionId) return;
    
    const initSession = async (retryCount = 0) => {
      try {
        console.log("Initializing session with:", {
          userId,
          subtopicId: questions.length > 0 ? questions[0].subtopicId : 'No questions available',
          endpoint: apiEndpoints.initSession
        });
        
        if (sessionInitializationRef.current) return;
        sessionInitializationRef.current = true;
        
        const sessionId = await sessionManager.initSession(
          userId,
          questions[0].subtopicId,
          apiEndpoints.initSession,
          retryCount
        );
        
        if (sessionId) {
          console.log("Session successfully initialized with ID:", sessionId);
          setCurrentSessionId(sessionId);
          if (onSessionIdUpdate) {
            onSessionIdUpdate(sessionId);
          }
        } else {
          console.error("Failed to initialize session - no session ID returned");
          setInitError('Failed to initialize session');
        }
      } catch (error) {
        console.error(`[${subjectType}] Error initializing test session:`, error);
        // Retry up to 3 times with a delay
        if (retryCount < 3) {
          console.log(`Retrying session initialization (${retryCount + 1}/3)...`);
          setTimeout(() => initSession(retryCount + 1), 1000);
          return;
        }
        setInitError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };    
    initSession();
  }, [questions, userId, apiEndpoints.initSession, currentSessionId, subjectType, onSessionIdUpdate, sessionManager]);
  
  // Handle testSessionId changes from parent if provided
  useEffect(() => {
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeAllocation);
      setQuestionStartTime(Date.now());
      setIsPaused(false);
      setContentLoading(true);
    }
  }, [currentQuestion]);

  
  // Initialize timer when question changes
  useEffect(() => {
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeAllocation);
      setQuestionStartTime(Date.now());
      setIsPaused(false);
      setContentLoading(true);
    }
  }, [currentQuestion]);
  
  // Provide a safety fallback for content display
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (contentLoading) {
        console.log(`[${subjectType}] Fallback timer triggered for content`);
        setContentLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(fallbackTimer);
  }, [currentQuestionIndex, subjectType, contentLoading]);
  
  // Timer effect
  useEffect(() => {
    if (isPaused || isAnswerSubmitted || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPaused, isAnswerSubmitted, timeLeft]);
  
  // Update time spent for debugging
  useEffect(() => {
    if (isPaused || isAnswerSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeSpentOnQuestion(Math.round((Date.now() - questionStartTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [questionStartTime, isPaused, isAnswerSubmitted]);
  
  // Function to check the answer
  const checkAnswer = useCallback(async () => {
    if (!selectedOption || isAnswerSubmitted || !currentQuestion) return;
    
    // Get values
    const correctAnswerValue = currentQuestion.correctAnswer;
    const selectedOptionValue = currentQuestion.options.find(opt => opt.id === selectedOption)?.text || '';
    
    // Check if correct
    const isCorrect = correctAnswerValue === selectedOptionValue;
    
    // Update state
    setIsAnswerSubmitted(true);
    setIsAnswerCorrect(isCorrect);
    
    // Add to results
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
    
    // Calculate time spent
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Submit to API
    if (currentSessionId) {
      try {
        await sessionManager.trackAttempt(
          {
            userId,
            questionId: currentQuestion.id,
            topicId,
            subtopicId: currentQuestion.subtopicId,
            isCorrect,
            userAnswer: selectedOptionValue,
            timeSpent
          },
          apiEndpoints.trackAttempt
        );
      } catch (error) {
        console.error(`[${subjectType}] Error submitting answer:`, error);
      }
    }

    // Adaptive learning feedback
    if (currentSessionId && adaptiveLearningEnabled) {
      try {
        console.log("Preparing to send adaptive feedback with testAttemptId:", currentSessionId);

        const adaptivePayload = {
          testAttemptId: currentSessionId,
          questionResults: [{
            questionId: currentQuestion.id,
            isCorrect: isCorrect,
            timeSpent
          }]
        };
        
        console.log("Adaptive feedback payload:", JSON.stringify(adaptivePayload, null, 2));

        const adaptiveResponse = await fetch(apiEndpoints.adaptiveFeedback, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(adaptivePayload)
        });
        
        if (!adaptiveResponse.ok) {
          const errorText = await adaptiveResponse.text();
          console.error(`Adaptive feedback request failed with status ${adaptiveResponse.status}:`, errorText);
          return;
        }

        let adaptiveData;
        try {
          adaptiveData = await adaptiveResponse.json();
        } catch (e) {
          console.error("Failed to parse adaptive feedback response as JSON:", e);
          return;
        }
        
        if (adaptiveData.success) {
          console.log("Adaptive feedback successful:", adaptiveData);
          // Store any learning gaps or recommendations
          setLearningGaps(adaptiveData.gaps || []);
          setAdaptiveRecommendations(adaptiveData.recommendations || []);
        } else {
          console.error("Adaptive feedback returned error:", adaptiveData);
        }
      } catch (error) {
        console.error(`[${subjectType}] Error submitting adaptive feedback:`, error);
      }
    }

  }, [
    selectedOption, 
    isAnswerSubmitted, 
    currentQuestion, 
    questionStartTime, 
    currentSessionId, 
    userId, 
    topicId, 
    apiEndpoints.adaptiveFeedback,
    apiEndpoints.trackAttempt,
    subjectType,
    adaptiveLearningEnabled,
    sessionManager
  ]);
  
  // Auto-submit when timer runs out
  useEffect(() => {
    if (timeLeft === 0 && !isAnswerSubmitted && selectedOption) {
      checkAnswer();
    }
  }, [timeLeft, isAnswerSubmitted, selectedOption, checkAnswer]);
  
  // Function to handle option selection
  const handleOptionSelect = useCallback((optionId: string) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionId);
    }
  }, [isAnswerSubmitted]);
  
 // Function to format time
 const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

  // Function to toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);
  
  // Function to move to the next question
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

  // Modify completedQuiz function to include adaptive learning data
  const completeQuiz = useCallback(async () => {
    // Existing code for showing summary and updating questions
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
      try {
        const completed = await sessionManager.completeSession(userId, currentSessionId, apiEndpoints.completeSession);
        
        // If adaptive learning is enabled, send the full results for analysis
        if (adaptiveLearningEnabled) {
          try {
            console.log("Sending final adaptive feedback with testAttemptId:", currentSessionId);
            
            const finalResults = results.questions.map(q => ({
              questionId: q.id,
              isCorrect: q.correctAnswer === q.userAnswer,
              timeSpent: 0 // Time spent not tracked per question in this context
            }));
            
            console.log("Final adaptive feedback payload:", {
              testAttemptId: currentSessionId,
              questionResults: finalResults
            });
            
            const adaptiveResponse = await fetch(apiEndpoints.adaptiveFeedback, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                testAttemptId: currentSessionId,
                questionResults: finalResults
              })
            });
            
            if (!adaptiveResponse.ok) {
              const errorText = await adaptiveResponse.text();
              console.error(`Final adaptive feedback request failed with status ${adaptiveResponse.status}:`, errorText);
              return;
            }
            
            let adaptiveData;
            try {
              adaptiveData = await adaptiveResponse.json();
            } catch (e) {
              console.error("Failed to parse final adaptive feedback response as JSON:", e);
              return;
            }
            
            if (adaptiveData.success) {
              console.log("Final adaptive feedback successful:", adaptiveData);
              setLearningGaps(adaptiveData.gaps || []);
              setAdaptiveRecommendations(adaptiveData.recommendations || []);
            } else {
              console.error("Final adaptive feedback returned error:", adaptiveData);
            }
          } catch (error) {
            console.error(`[${subjectType}] Error submitting final adaptive feedback:`, error);
          }
        }
        
        // Only reset session initialization flag to allow future sessions
        if (completed) {
          sessionInitializationRef.current = false;
        }
      } catch (error) {
        console.error(`[${subjectType}] Error completing test session:`, error);
      }
    }
  }, [
    questions, 
    results, 
    onQuestionsUpdate, 
    currentSessionId, 
    userId, 
    apiEndpoints.completeSession,
    apiEndpoints.adaptiveFeedback,
    calculateNewStatus, 
    subjectType,
    adaptiveLearningEnabled,
    sessionManager
  ]);
  
  // Fetch adaptive learning settings when component mounts
  useEffect(() => {
    
const fetchAdaptiveSettings = async () => {
  if (!userId) return;

  try {
    console.log(`[${subjectType}] Fetching adaptive settings from: ${apiEndpoints.adaptiveSettings}`);
    
    const response = await fetch(apiEndpoints.adaptiveSettings);
    
    if (response.ok) {
      try {
        const data = await response.json();
        
        if (data.success) {
          console.log(`[${subjectType}] Adaptive settings fetched successfully`);
          setAdaptiveLearningEnabled(data.settings.enableAdaptiveLearning);
        } else {
          console.warn(`[${subjectType}] Adaptive settings response not successful:`, data);
          // Fall back to default
          setAdaptiveLearningEnabled(useAdaptiveLearning);
        }
      } catch (parseError) {
        console.error(`[${subjectType}] Error parsing adaptive settings response:`, parseError);
        setAdaptiveLearningEnabled(useAdaptiveLearning);
      }
    } else {
      // Handle server error
      try {
        const errorText = await response.text();
        console.error(`[${subjectType}] Error fetching adaptive settings (${response.status}):`, errorText);
      } catch (e) {
        console.error(`[${subjectType}] Error fetching adaptive settings (${response.status})`);
      }
      
      // Graceful fallback
      console.info(`[${subjectType}] Using default adaptive learning setting: ${useAdaptiveLearning}`);
      setAdaptiveLearningEnabled(useAdaptiveLearning);
    }
  } catch (error) {
    console.error(`[${subjectType}] Error fetching adaptive settings:`, error);
    // Default to using whatever was passed in props
    console.info(`[${subjectType}] Using default adaptive learning setting due to error: ${useAdaptiveLearning}`);
    setAdaptiveLearningEnabled(useAdaptiveLearning);
  }
};

    fetchAdaptiveSettings();
  }, [userId, subjectType, useAdaptiveLearning, apiEndpoints.adaptiveSettings]);

  const verifyAdaptiveStatus = useCallback(() => {
    // This function helps diagnose the state of adaptive learning
    console.info(`[${subjectType}] Adaptive learning status:
      - Enabled from settings: ${adaptiveLearningEnabled}
      - Default setting from props: ${useAdaptiveLearning}
      - Current recommendations: ${adaptiveRecommendations.length}
      - Current learning gaps: ${learningGaps.length}
    `);
  }, [adaptiveLearningEnabled, useAdaptiveLearning, adaptiveRecommendations.length, learningGaps.length, subjectType]);
  
  // Add this to your component before the return statement
  useEffect(() => {
    // Add a small delay to check adaptive status after settings are fetched
    const timer = setTimeout(() => {
      verifyAdaptiveStatus();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [adaptiveLearningEnabled, verifyAdaptiveStatus]);
  
  // Render adaptive recommendations
  const renderAdaptiveRecommendations = useCallback(() => {
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

  // Render adaptive learning indicator
  const renderAdaptiveIndicator = useCallback(() => {
    if (!adaptiveLearningEnabled) {
      return null;
    }
  
    return (
      <div className="inline-flex items-center text-xs gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
        <Brain className="h-3 w-3" />
        <span>Adaptive</span>
      </div>
    );
  }, [adaptiveLearningEnabled]);
  
  // Function to go back to topics page
  const goBackToTopics = useCallback(() => {
    if (currentSessionId) {
      try {
        fetch(apiEndpoints.completeSession, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testSessionId: currentSessionId,
            userId
          })
        }).then(response => {
          if (response.ok) {
            console.log(`[${subjectType}] Session completed on navigation`);
          } else {
            console.warn(`[${subjectType}] Failed to complete session on navigation`);
          }
          
          setCurrentSessionId(null);
          sessionInitializationRef.current = true;
          
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
          
          router.push(`/${subjectType}/topics/${topicId}`);
        });
      } catch (error) {
        console.error(`[${subjectType}] Error completing session on navigation:`, error);
        router.push(`/${subjectType}/topics/${topicId}`);
      }
    } else {
      router.push(`/${subjectType}/topics/${topicId}`);
    }
  }, [currentSessionId, apiEndpoints.completeSession, userId, subjectType, onSessionIdUpdate, router, topicId]);
  
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

  // Show initialization error
  if (initError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Session Initialization Error</h2>
          <div className="bg-red-50 p-4 rounded-lg mb-4 text-red-700">
            <p className="font-medium">Failed to start quiz session</p>
            <p className="text-sm mt-1">{initError}</p>
            <p className="text-sm mt-2">Check your network connection and try again.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={goBackToTopics}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="max-w-4xl mx-auto">
      {/* If showing the quiz summary, return that directly */}
      {isQuizCompleted && showQuizSummary ? (
        quizSummaryContent
      ) : (
        <>
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
            {/* Quiz content */}
            {!isQuizCompleted ? (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {subtopicName} - Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                <div className="w-full bg-gray-200 h-2 mb-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300 ease-out" 
                    style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                  />
                </div>
                
                {/* Timer and status display */}
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
                    {renderAdaptiveIndicator()}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded ${
                    currentQuestion.status === 'Mastered' ? 'bg-green-100 text-green-800' :
                    currentQuestion.status === 'Learning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  } font-medium text-sm`}>
                    {currentQuestion.status}
                  </span>
                </div>
                
                {/* Question */}
                <div className="mb-6 question-container">
                  {contentLoading ? (
                    <>
                      <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2"></div>
                    </>
                  ) : (
                    <div className="text-lg">
                      {renderers.questionRenderer(currentQuestion.question)}
                    </div>
                  )}
                </div>
                
                {/* Options */}
                <div className="space-y-3 mb-6 options-container" style={{ 
                    opacity: contentLoading ? 0.6 : 1,
                    transition: 'opacity 0.3s ease-in-out'
                  }}>
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={option.id}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          contentLoading ? 'pointer-events-none' : ''
                        } ${
                          selectedOption === option.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        } ${
                          isAnswerSubmitted && option.text === currentQuestion.correctAnswer
                            ? 'bg-green-50 border-green-500'
                            : ''
                        } ${
                          isAnswerSubmitted && 
                          selectedOption === option.id && 
                          option.text !== currentQuestion.correctAnswer
                            ? 'bg-red-50 border-red-500'
                            : ''
                        }`}
                        onClick={() => handleOptionSelect(option.id)}
                      >
                        {contentLoading ? (
                          <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4"></div>
                        ) : (
                            <div className="flex items-center w-full">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-800 font-medium">
                                {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                              </div>
                              <div className="option-text-container flex-grow">
                                {renderers.optionTextRenderer 
                                  ? renderers.optionTextRenderer(option) 
                                  : option.text}
                              </div>
                            </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                <div className="flex justify-between">
                  <div>
                    {/* Current progress */}
                    <div className="text-sm text-gray-500">
                      {results.correctCount} correct of {results.totalCount} answered
                    </div>
                  </div>
                  
                  <div className="space-x-3">
                    {!isAnswerSubmitted ? (
                      <button
                        onClick={checkAnswer}
                        disabled={!selectedOption || contentLoading}
                        className={`px-4 py-2 rounded ${
                          selectedOption && !contentLoading
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {contentLoading ? 'Loading...' : 'Check Answer'}
                      </button>
                    ) : (
                      <button
                        onClick={nextQuestion}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                      >
                        {currentQuestionIndex === questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Formula (if exists) */}
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

                {/* Explanation after answering */}
                {isAnswerSubmitted && (
                  <>
                    <div className={`p-4 mb-6 rounded ${isAnswerCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="font-medium mb-2">
                        {isAnswerCorrect ? 'Correct!' : 'Incorrect!'}
                      </div>
                      <div>
                        {renderers.mathJaxRenderer(currentQuestion.explanation)}
                      </div>
                    </div>
                    {renderAdaptiveRecommendations()}
                  </>
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
                    onClick={completeQuiz}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    View Summary
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default QuizPage;