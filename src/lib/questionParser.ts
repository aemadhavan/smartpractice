// src/utils/questionParser.ts

export type Option = {
  id: string;
  text: string;
};

export type Question = {
  id: number;
  question: string;
  options: string | string[] | Record<string, unknown> | unknown[]; // Replaced any with more specific types
  correctOption: string;
  explanation: string;
  formula?: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  status?: 'Mastered' | 'Learning' | 'To Start';
  attemptCount?: number;
  successRate?: number;
};

export type ProcessedQuestion = Omit<Question, 'options'> & {
  options: Option[];
};

/**
 * Safely parse question options from various formats to a consistent Option[] array
 * This handles JSON strings, arrays, objects, and provides fallbacks
 */
export function parseQuestionOptions(question: Question): ProcessedQuestion {
  let parsedOptions: Option[] = [];
  const rawOptions = question.options;
  
  console.log(`Parsing options for question ${question.id}`, rawOptions);
  
  try {
    // Handle string format (JSON string)
    if (typeof rawOptions === 'string') {
      try {
        const parsed = JSON.parse(rawOptions);
        if (Array.isArray(parsed)) {
          parsedOptions = parsed.map(normalizeOption);
        } else if (parsed && typeof parsed === 'object') {
          parsedOptions = Object.values(parsed).map(normalizeOption);
        }
      } catch (e) {
        console.error('Failed to parse options JSON string:', e);
        // If it's a simple string, create a single option
        parsedOptions = [{ id: rawOptions, text: rawOptions }];
      }
    } 
    // Handle array format
    else if (Array.isArray(rawOptions)) {
      parsedOptions = rawOptions.map(normalizeOption);
    } 
    // Handle object format (could be {0: {}, 1: {}} or {A: {}, B: {}})
    else if (rawOptions && typeof rawOptions === 'object') {
      parsedOptions = Object.values(rawOptions as Record<string, unknown>).map(normalizeOption);
    }
    
    // If we somehow ended up with no options, check if the correct answer can help
    if (parsedOptions.length === 0 && question.correctOption) {
      // Create at least one correct option to prevent complete breakage
      parsedOptions = [{ id: question.correctOption, text: question.correctOption }];
      
      // Try to create some dummy wrong options too
      if (typeof question.correctOption === 'string') {
        // For numeric answers, create options around the correct value
        if (!isNaN(Number(question.correctOption))) {
          const correctNum = Number(question.correctOption);
          parsedOptions = [
            { id: String(correctNum - 2), text: String(correctNum - 2) },
            { id: String(correctNum - 1), text: String(correctNum - 1) },
            { id: String(correctNum), text: String(correctNum) },
            { id: String(correctNum + 1), text: String(correctNum + 1) },
            { id: String(correctNum + 2), text: String(correctNum + 2) },
          ];
        } else {
          // For non-numeric, create generic options
          parsedOptions = [
            { id: 'A', text: question.correctOption },
            { id: 'B', text: 'Option B' },
            { id: 'C', text: 'Option C' },
            { id: 'D', text: 'Option D' },
          ];
        }
      }
    }
    
    // Ensure each option has a unique ID
    parsedOptions = ensureUniqueOptionIds(parsedOptions);
    
  } catch (e) {
    console.error(`Error processing options for question ${question.id}:`, e);
    parsedOptions = [];
  }
  
  // Return the processed question with normalized options
  return {
    ...question,
    options: parsedOptions
  };
}

/**
 * Normalize an option to ensure it has id and text properties
 */
function normalizeOption(opt: unknown): Option {
  if (typeof opt === 'string') {
    return { id: opt, text: opt };
  }
  
  if (opt === null || typeof opt !== 'object') {
    const str = String(opt);
    return { id: str, text: str };
  }
  
  // At this point, we know opt is a non-null object
  const option = opt as Record<string, unknown>;
  
  // Extract id and text, using fallbacks as needed
  return {
    id: String(option.id || option.value || option.key || Math.random()),
    text: String(option.text || option.label || option.content || opt)
  };
}

/**
 * Ensure option IDs are unique
 */
function ensureUniqueOptionIds(options: Option[]): Option[] {
  const seen = new Set<string>();
  
  return options.map(opt => {
    let id = opt.id;
    let counter = 1;
    
    // If this ID is already used, append a counter
    while (seen.has(id)) {
      id = `${opt.id}_${counter++}`;
    }
    
    seen.add(id);
    return { ...opt, id };
  });
}

/**
 * Process all questions in a subtopic to ensure options are properly formatted
 */
export function processSubtopicQuestions(questions: Question[]): ProcessedQuestion[] {
  return questions.map(parseQuestionOptions);
}