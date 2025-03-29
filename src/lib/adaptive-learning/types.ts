// src/lib/adaptive-learning/types.ts

import { QuizQuestion } from '@/types/quiz';

// First, let's check what the actual QuizQuestion type looks like
// Since we need to base our AdaptiveQuestion off this
// We need to import the QuizQuestion type but also modify our extension 
// to ensure property types match

/**
 * Type for question with metadata needed for adaptive selection
 * This type is based on QuizQuestion but doesn't extend it to avoid type conflicts
 */
export interface AdaptiveQuestion {
  // Base properties from QuizQuestion 
  id: number;
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  explanation: string;
  formula?: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  attemptCount: number;
  successRate: number; // This is required in QuizQuestion
  status: 'Mastered' | 'Learning' | 'To Start';
  subtopicId: number;
  
  // Additional properties for adaptive learning
  selectionReason?: string;
  adaptivelySelected?: boolean;
}

export interface LearningGap {
  id: number;
  userId: string;
  subtopicId: number;
  conceptDescription: string;
  severity: number;
  evidenceQuestionIds?: string;
  status: 'active' | 'resolved' | 'dismissed';
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdaptiveSettings {
  userId: string;
  adaptivityLevel: number;
  difficultyPreference: 'balanced' | 'challenging' | 'easier';
  enableAdaptiveLearning: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdaptiveRecommendation {
  id: number;
  name: string;
  reason: string;
}

export interface AdaptiveLearningResponse {
  recommendedSubtopics: AdaptiveRecommendation[];
  learningGapsCount: number;
  hasAdaptiveLearningEnabled: boolean;
}