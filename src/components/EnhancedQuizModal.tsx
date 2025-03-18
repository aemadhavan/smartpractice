// File: /src/components/EnhancedQuizModal.tsx

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Option, 
  //formatOptionText
} from '@/lib/options';
import sessionManager from '@/lib/session-manager';

// Keep the original types for compatibility
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

interface ApiEndpoints {
  initSession: string;
  trackAttempt: string;
  completeSession: string;
}

// Keep original props to maintain backwards compatibility
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
  calculateNewStatus?: (question: QuizQuestion, isCorrect: boolean, successRate: number) => 'Mastered' | 'Learning' | 'To Start';
  subjectType: 'maths' | 'quantitative';
};

/**
 * This component is now a redirect wrapper instead of a modal.
 * It redirects to the questions page when isOpen is true.
 */
const EnhancedQuizModal: React.FC<EnhancedQuizModalProps> = ({
  isOpen,
  onClose,
  topicId,
  onSessionIdUpdate,
  questions,
  //userId,
  //apiEndpoints,
  subjectType
}) => {
  const router = useRouter();
  
  // Reset session manager when the component is mounted or questions change
  useEffect(() => {
    if (questions && questions.length > 0) {
      console.log(`[${subjectType}] EnhancedQuizModal - Ensuring clean session state`);
      sessionManager.reset();
    }
  }, [questions, subjectType]);
  
  // Redirect to the questions page when isOpen becomes true
  useEffect(() => {
    if (isOpen && questions && questions.length > 0) {
      console.log(`[${subjectType}] Redirecting to questions page for topic:`, topicId);
      
      // Clear any session state first
      sessionManager.reset();
      
      if (onSessionIdUpdate) {
        onSessionIdUpdate(null);
      }
      
      // Call onClose to clean up state in parent component
      onClose();
      
      // Redirect to questions page
      router.push(`/maths/topics/${topicId}/questions?subtopicId=${questions[0]?.subtopicId || topicId}`);
    }
  }, [isOpen, topicId, router, onClose, onSessionIdUpdate, questions, subjectType]);
  
  // Don't render anything - this is just a redirect handler
  return null;
};

export default EnhancedQuizModal;