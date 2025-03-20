// src/lib/quantitative-adaptive-learning/index.ts

import { db } from '@/db';
import { 
  quantQuestionAttempts, 
  quantSubtopics, 
  quantSubtopicProgress, 
  quantQuestions, 
  quantTestAttempts 
} from '@/db/quantitative-schema';
import { 
  quantLearningGaps, 
  userQuantAdaptiveSettings, 
  quantAdaptiveQuestionSelection 
} from '@/db/quantitative-adaptive-schema';
import { eq, and, desc, isNull, inArray } from 'drizzle-orm';

/**
 * Type for question with metadata needed for adaptive selection
 */
export interface AdaptiveQuestion {
  id: number;
  difficultyLevelId: number;
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  explanation: string;
  successRate?: number;
}

/**
 * Analyzes user performance to identify learning gaps in Quantitative reasoning
 */
export async function detectQuantLearningGaps(userId: string, subtopicId: number): Promise<void> {
  // 1. Get all question attempts for this subtopic
  const attempts = await db.select()
    .from(quantQuestionAttempts)
    .innerJoin(quantTestAttempts, eq(quantQuestionAttempts.testAttemptId, quantTestAttempts.id))
    .innerJoin(quantQuestions, eq(quantQuestionAttempts.questionId, quantQuestions.id))
    .where(
      and(
        eq(quantTestAttempts.userId, userId),
        eq(quantTestAttempts.subtopicId, subtopicId)
      )
    );

  // 2. Analyze for patterns in incorrect answers
  const incorrectAttempts = attempts.filter(attempt => !attempt.quantQuestionAttempts.isCorrect);
  
  if (incorrectAttempts.length < 3) {
    // Not enough data to detect patterns
    return;
  }
  
  // 3. Group incorrect answers by concept
  // Use questionTypeId as a proxy for concept
  const categorizedAttempts = incorrectAttempts.reduce((acc, attempt) => {
    const conceptId = attempt.quantQuestions.questionTypeId.toString();
    if (!acc[conceptId]) {
      acc[conceptId] = [];
    }
    acc[conceptId].push(attempt);
    return acc;
  }, {} as Record<string, typeof incorrectAttempts>);

  // 4. Find concepts with high error rates
  for (const [conceptId, conceptAttempts] of Object.entries(categorizedAttempts)) {
    if (conceptAttempts.length >= 3) {
      // Check if this is already a known gap
      const existingGap = await db.select().from(quantLearningGaps).where(
        and(
          eq(quantLearningGaps.userId, userId),
          eq(quantLearningGaps.subtopicId, subtopicId),
          eq(quantLearningGaps.conceptDescription, conceptId),
          isNull(quantLearningGaps.resolvedAt)
        )
      ).limit(1);

      if (existingGap.length === 0) {
        // Calculate gap severity (1-10)
        const severity = Math.min(10, Math.ceil(conceptAttempts.length / 2));
        
        // Create a new learning gap
        await db.insert(quantLearningGaps).values({
          userId,
          subtopicId,
          conceptDescription: conceptId,
          severity,
          evidenceQuestionIds: conceptAttempts.map(a => a.quantQuestionAttempts.questionId).join(','),
          status: 'active'
        });
      }
    }
  }
}

/**
 * Select questions adaptively based on user's performance history in Quantitative reasoning
 */
export async function selectAdaptiveQuantQuestions(
  userId: string, 
  subtopicId: number, 
  availableQuestions: AdaptiveQuestion[],
  sessionId: number | null
): Promise<AdaptiveQuestion[]> {
  if (availableQuestions.length === 0) {
    return [];
  }

  // 1. Get user's adaptive settings
  const userSettings = await db.select().from(userQuantAdaptiveSettings).where(
    eq(userQuantAdaptiveSettings.userId, userId)
  ).limit(1);

  // Create default settings if none exist
  if (userSettings.length === 0) {
    await db.insert(userQuantAdaptiveSettings).values({
      userId,
      adaptivityLevel: 5,
      difficultyPreference: 'balanced',
      enableAdaptiveLearning: true
    });
  }

  const settings = userSettings[0] || { 
    adaptivityLevel: 5, 
    difficultyPreference: 'balanced',
    enableAdaptiveLearning: true 
  };

  // 2. Get user's current progress for this subtopic
  const progressData = await db.select().from(quantSubtopicProgress).where(
    and(
      eq(quantSubtopicProgress.userId, userId),
      eq(quantSubtopicProgress.subtopicId, subtopicId)
    )
  ).limit(1);

  const progress = progressData[0] || { masteryLevel: 0 };

  // 3. Get learning gaps for this subtopic
  const gapsData = await db.select().from(quantLearningGaps).where(
    and(
      eq(quantLearningGaps.userId, userId),
      eq(quantLearningGaps.subtopicId, subtopicId),
      isNull(quantLearningGaps.resolvedAt)
    )
  );

  // 4. Get most recent question attempts
  const recentAttemptsData = await db.select()
    .from(quantQuestionAttempts)
    .innerJoin(
      quantTestAttempts,
      eq(quantQuestionAttempts.testAttemptId, quantTestAttempts.id)
    )
    .where(
      and(
        eq(quantTestAttempts.userId, userId),
        eq(quantTestAttempts.subtopicId, subtopicId)
      )
    )
    .orderBy(desc(quantQuestionAttempts.createdAt))
    .limit(10);

  const recentQuestionIds = recentAttemptsData.map(
    record => record.quantQuestionAttempts.questionId
  );

  // 5. Score questions based on multiple factors
  type ScoredQuestion = AdaptiveQuestion & { 
    score: number; 
    selectionReason: string; 
    _scoreDebug?: { 
      difficultyScore: number;
      gapScore: number;
      recentAttemptPenalty: number;
      successRateScore: number;
      randomFactor: number;
    };
  };
  
  const scoredQuestions = availableQuestions.map(question => {
    let score = 0;
    let selectionReason = '';

    // Score based on difficulty match
    const masteryLevel = progress.masteryLevel;
    const targetDifficulty = calculateTargetDifficulty(masteryLevel, settings.difficultyPreference);
    const difficultyScore = 10 - Math.abs(question.difficultyLevelId - targetDifficulty);
    score += difficultyScore * 2; // Weight: 2

    // Score based on gap relevance
    let gapScore = 0;
    const relevantGap = gapsData.find(gap => {
      return gap.evidenceQuestionIds?.includes(question.id.toString()) || false;
    });

    if (relevantGap) {
      gapScore = relevantGap.severity;
      selectionReason = 'filling_learning_gap';
    }
    score += gapScore * 3; // Weight: 3
    
    // Score based on recency (avoid recently attempted questions)
    const isRecentlyAttempted = recentQuestionIds.includes(question.id);
    const recentAttemptPenalty = isRecentlyAttempted ? -15 : 0;
    score += recentAttemptPenalty;

    // Score based on success rate (prioritize questions with lower success rates)
    const successRate = question.successRate || 50;
    const successRateScore = 10 - (successRate / 10);
    score += successRateScore;

    // If no selection reason has been set, determine based on scores
    if (!selectionReason) {
      if (difficultyScore > 7) {
        selectionReason = 'appropriate_difficulty';
      } else if (successRateScore > 5) {
        selectionReason = 'reinforcing_weak_area';
      } else {
        selectionReason = 'balanced_selection';
      }
    }

    // Add a small random factor to prevent predictability
    const randomFactor = Math.random() * 5;
    score += randomFactor;

    return {
      ...question,
      score,
      selectionReason,
      _scoreDebug: {
        difficultyScore: difficultyScore * 2,
        gapScore: gapScore * 3,
        recentAttemptPenalty,
        successRateScore,
        randomFactor
      }
    } as ScoredQuestion;
  });

  // 6. Sort questions by score and select the top ones
  const selectedQuestions = scoredQuestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // 7. If we have a session ID, log the selection for analysis
  if (sessionId) {
    const selectionLogs = selectedQuestions.map((question, index) => ({
      sessionId,
      questionId: question.id,
      selectionReason: question.selectionReason,
      difficultyLevel: question.difficultyLevelId,
      sequencePosition: index
    }));

    await db.insert(quantAdaptiveQuestionSelection).values(selectionLogs);
  }

  // Remove the scoring fields before returning
  return selectedQuestions.map(({ id, difficultyLevelId, question, options, correctAnswer, explanation, successRate }) => ({
    id,
    difficultyLevelId,
    question,
    options,
    correctAnswer,
    explanation,
    successRate
  }));
}

/**
 * Calculate the target difficulty level based on mastery and preference
 */
function calculateTargetDifficulty(
  masteryLevel: number, 
  difficultyPreference: string
): number {
  // Mastery level is 0-100, difficulty is 1-5
  // Base difficulty on mastery (higher mastery → higher difficulty)
  const baseDifficulty = Math.ceil(masteryLevel / 20);
  
  // Adjust based on preference
  switch (difficultyPreference) {
    case 'challenging':
      return Math.min(5, baseDifficulty + 1);
    case 'easier':
      return Math.max(1, baseDifficulty - 1);
    case 'balanced':
    default:
      return Math.max(1, Math.min(5, baseDifficulty));
  }
}

/**
 * Update learning gaps based on latest performance
 */
export async function updateQuantLearningGaps(
  userId: string,
  subtopicId: number,
  questionResults: { id: number; isCorrect: boolean; }[]
): Promise<void> {
  // 1. Get active learning gaps for this subtopic
  const activeGaps = await db.select().from(quantLearningGaps).where(
    and(
      eq(quantLearningGaps.userId, userId),
      eq(quantLearningGaps.subtopicId, subtopicId),
      isNull(quantLearningGaps.resolvedAt)
    )
  );

  // 2. For each gap, check if recent performance suggests the gap is addressed
  for (const gap of activeGaps) {
    // Get question IDs associated with this gap
    const gapQuestionIds = gap.evidenceQuestionIds
      ? gap.evidenceQuestionIds.split(',').map(id => parseInt(id.trim(), 10))
      : [];
    
    // Find question results relevant to this gap
    const relevantResults = questionResults.filter(result => 
      gapQuestionIds.includes(result.id)
    );
    
    // If the user answered enough relevant questions correctly, mark the gap as resolved
    if (relevantResults.length >= 2) {
      const correctCount = relevantResults.filter(r => r.isCorrect).length;
      const correctPercentage = (correctCount / relevantResults.length) * 100;
      
      if (correctPercentage >= 75) {
        await db.update(quantLearningGaps)
          .set({ 
            resolvedAt: new Date(),
            status: 'resolved'
          })
          .where(eq(quantLearningGaps.id, gap.id));
      }
    }
  }
  
  // 3. Detect any new learning gaps
  await detectQuantLearningGaps(userId, subtopicId);
}

/**
 * Get recommended next steps for a user based on their learning gaps
 */
export async function getAdaptiveQuantLearningRecommendations(
  userId: string,
  topicId: number
): Promise<{
  recommendedSubtopics: { id: number; name: string; reason: string; }[];
  learningGapsCount: number;
  hasAdaptiveLearningEnabled: boolean;
}> {
  // 1. Check if adaptive learning is enabled
  const userSettingsData = await db.select().from(userQuantAdaptiveSettings).where(
    eq(userQuantAdaptiveSettings.userId, userId)
  ).limit(1);
  
  const settings = userSettingsData[0];
  const hasAdaptiveLearningEnabled = settings?.enableAdaptiveLearning ?? true;

  // 2. Get all subtopics for this topic
  const subtopics = await db.select().from(quantSubtopics).where(
    eq(quantSubtopics.topicId, topicId)
  );
  
  const subtopicIds = subtopics.map(s => s.id);
  
  // 3. Get user's progress for these subtopics
  const progressData = await db.select()
    .from(quantSubtopicProgress)
    .where(
      and(
        eq(quantSubtopicProgress.userId, userId),
        inArray(quantSubtopicProgress.subtopicId, subtopicIds)
      )
    );

  // 4. Get learning gaps for these subtopics
  const gapsData = await db.select()
    .from(quantLearningGaps)
    .innerJoin(
      quantSubtopics, 
      eq(quantLearningGaps.subtopicId, quantSubtopics.id)
    )
    .where(
      and(
        eq(quantLearningGaps.userId, userId),
        eq(quantSubtopics.topicId, topicId),
        isNull(quantLearningGaps.resolvedAt)
      )
    );

  // 5. Identify subtopics with learning gaps
  const subtopicsWithGaps = [...new Set(gapsData.map(g => g.quantLearningGaps.subtopicId))];

  // 6. Identify subtopics with low mastery
  const lowMasterySubtopics = progressData
    .filter(progress => progress.masteryLevel < 50)
    .map(progress => progress.subtopicId);

    // 7. Generate recommendations
    const recommendedSubtopics: { id: number; name: string; reason: string; }[] = [];
    
    // Prioritize subtopics with gaps
    for (const subtopicId of subtopicsWithGaps) {
        const subtopic = subtopics.find(s => s.id === subtopicId);
        if (subtopic) {
          recommendedSubtopics.push({
            id: subtopicId,
            name: subtopic.name,
            reason: 'Learning gap detected - practice needed'
          });
        }
      }
    
    // Add subtopics with low mastery (if not already included)
    for (const subtopicId of lowMasterySubtopics) {
        if (!subtopicsWithGaps.includes(subtopicId)) {
          const subtopic = subtopics.find(s => s.id === subtopicId);
          if (subtopic) {
            recommendedSubtopics.push({
              id: subtopicId,
              name: subtopic.name,
              reason: 'Low mastery level - more practice recommended'
            });
          }
        }
      }
  
    // 8. Add next logical subtopic if no recommendations yet
    if (recommendedSubtopics.length === 0 && progressData.length > 0) {
        // Find subtopic with highest mastery as a reference
        const highestMastery = progressData.reduce(
          (max, progress) => Math.max(max, progress.masteryLevel),
          0
        );
        
        // If user has mastered some content, recommend the next level
        if (highestMastery > 70) {
          // Find subtopics the user hasn't practiced yet
          const practicedSubtopicIds = progressData.map(p => p.subtopicId);
          const unpracticedSubtopics = subtopics.filter(
            subtopic => !practicedSubtopicIds.includes(subtopic.id)
          );
          
          if (unpracticedSubtopics.length > 0) {
            recommendedSubtopics.push({
              id: unpracticedSubtopics[0].id,
              name: unpracticedSubtopics[0].name,
              reason: 'Next subtopic in progression'
            });
          }
        }
      }
  
      return {
        recommendedSubtopics,
        learningGapsCount: gapsData.length,
        hasAdaptiveLearningEnabled
      };
    
  }
  
  /**
   * Toggle adaptive learning on/off for a user in Quantitative reasoning
   */
  export async function toggleQuantAdaptiveLearning(userId: string): Promise<boolean> {
    // Get current settings
    const settings = await db.select().from(userQuantAdaptiveSettings).where(
      eq(userQuantAdaptiveSettings.userId, userId)
    ).limit(1);
    
    // If no settings exist, create with default values (enabled)
    if (settings.length === 0) {
      await db.insert(userQuantAdaptiveSettings).values({
        userId,
        adaptivityLevel: 5,
        difficultyPreference: 'balanced',
        enableAdaptiveLearning: true
      });
      return true;
    }
    
    // Toggle existing settings
    const currentSetting = settings[0];
    const newValue = !currentSetting.enableAdaptiveLearning;
    
    await db.update(userQuantAdaptiveSettings)
      .set({ enableAdaptiveLearning: newValue })
      .where(eq(userQuantAdaptiveSettings.userId, userId));
    
    return newValue;
  }
  
  /**
   * Save user's adaptive learning preferences for Quantitative reasoning
   */
  export async function saveQuantAdaptiveSettings(
    userId: string, 
    settings: { 
      adaptivityLevel?: number; 
      difficultyPreference?: string; 
      enableAdaptiveLearning?: boolean; 
    }
  ): Promise<void> {
    const existingSettings = await db.select().from(userQuantAdaptiveSettings).where(
      eq(userQuantAdaptiveSettings.userId, userId)
    ).limit(1);
  
    if (existingSettings.length === 0) {
      // Create new settings
      await db.insert(userQuantAdaptiveSettings).values({
        userId,
        adaptivityLevel: settings.adaptivityLevel ?? 5,
        difficultyPreference: settings.difficultyPreference ?? 'balanced',
        enableAdaptiveLearning: settings.enableAdaptiveLearning ?? true
      });
    } else {
      // Update existing settings
      const currentSettings = existingSettings[0];
      await db.update(userQuantAdaptiveSettings)
        .set({
          adaptivityLevel: settings.adaptivityLevel ?? currentSettings.adaptivityLevel,
          difficultyPreference: settings.difficultyPreference ?? currentSettings.difficultyPreference,
          enableAdaptiveLearning: settings.enableAdaptiveLearning ?? currentSettings.enableAdaptiveLearning,
          updatedAt: new Date()
        })
        .where(eq(userQuantAdaptiveSettings.userId, userId));
    }
  }