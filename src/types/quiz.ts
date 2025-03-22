// src/types/quiz.ts
import React from 'react';

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

export interface AttemptData {
  userId: string;
  questionId: number;
  topicId: number;
  subtopicId: number;
  isCorrect: boolean;
  userAnswer: string;
  timeSpent: number;
}

export interface SessionManager {
  initSession: (userId: string, subtopicId: number, initSessionEndpoint: string, retryCount?: number) => Promise<number | null>;
  trackAttempt: (attemptData: AttemptData, trackAttemptEndpoint: string) => Promise<boolean>;
  completeSession: (userId: string, sessionId: number, completeSessionEndpoint: string) => Promise<boolean>;
}

export interface QuizRenderers {
  optionTextRenderer?: (text: string | Option | null | undefined) => React.ReactNode;
  questionRenderer: (content: string) => React.ReactNode;
  mathJaxRenderer: (content: string) => React.ReactNode;
}

export interface QuizSummaryProps {
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
}

export interface UseQuizSessionProps {
  userId: string;
  questions: QuizQuestion[];
  sessionManager: SessionManager;
  apiEndpoints: ApiEndpoints;
  subjectType: string;
  onSessionIdUpdate?: (sessionId: number | null) => void;
}

export interface UseQuizTimerProps {
  defaultTime: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export interface UseQuizStateProps {
  questions: QuizQuestion[];
  userId: string;
  topicId: number;
  currentSessionId: number | null;
  trackAttempt: (attemptData: AttemptData) => Promise<boolean>;
  completeSession: (userId: string, sessionId: number | null, endpoint: string) => Promise<boolean>;
  onQuestionsUpdate?: (questions: QuizQuestion[]) => void;
  calculateNewStatus?: (
    question: QuizQuestion,
    isCorrect: boolean,
    successRate: number
  ) => 'Mastered' | 'Learning' | 'To Start';
  apiEndpoints: {
    completeSession: string;
  };
  subjectType: string;
}

export interface QuizPageProps {
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
  sessionManager: SessionManager;
  QuizSummaryComponent: React.ComponentType<QuizSummaryProps>;
  renderers: QuizRenderers;
}


export interface UseAdaptiveLearningProps {
  enableAdaptiveLearning: boolean; // Changed from useAdaptiveLearning
  userId: string;
  apiEndpoints: {
    adaptiveFeedback: string;
    adaptiveSettings: string;
  };
  subjectType: string;
}