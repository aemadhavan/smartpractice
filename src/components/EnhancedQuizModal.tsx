// File: /src/components/EnhancedQuizModal.tsx

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Option } from '@/lib/options';
import sessionManager from '@/lib/session-manager';

// Define the QuizQuestion type for compatibility across subjects
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

// Define the ApiEndpoints interface (unused in this component but kept for prop compatibility)
interface ApiEndpoints {
  initSession: string;
  trackAttempt: string;
  completeSession: string;
}

// Define the props interface, maintaining backwards compatibility
type EnhancedQuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
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
};

/**
 * EnhancedQuizModal is a redirect wrapper that navigates to the questions page
 * when isOpen is true. It dynamically supports 'maths' and 'quantitative' subjects
 * using the subjectType prop and integrates with a generic session-manager.
 */
const EnhancedQuizModal: React.FC<EnhancedQuizModalProps> = ({
  isOpen,
  onClose,
  topicId,
  onSessionIdUpdate,
  questions,
  subjectType,
}) => {
  const router = useRouter();

  // Reset session manager when questions change to ensure a clean state
  useEffect(() => {
    if (questions && questions.length > 0) {
      console.log(`[${subjectType}] EnhancedQuizModal - Ensuring clean session state`);
      sessionManager.reset();
    }
  }, [questions, subjectType]);

  // Handle redirection to the questions page when isOpen is true
  useEffect(() => {
    if (isOpen && questions && questions.length > 0) {
      console.log(`[${subjectType}] Redirecting to questions page for topic:`, topicId);

      // Reset session state before redirecting
      sessionManager.reset();

      // Clear session ID in parent component if callback is provided
      if (onSessionIdUpdate) {
        onSessionIdUpdate(null);
      }

      // Trigger onClose to update parent state (e.g., set isOpen to false)
      onClose();

      // Redirect to the questions page with a dynamic subject path
      router.push(
        `/${subjectType}/topics/${topicId}/questions?subtopicId=${questions[0]?.subtopicId || topicId}`
      );
    }
  }, [isOpen, topicId, router, onClose, onSessionIdUpdate, questions, subjectType]);

  // Return null as this component is a redirect handler, not a UI renderer
  return null;
};

export default EnhancedQuizModal;