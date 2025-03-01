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
  
  console.log(`Parsing options for question ${question.id}`, {
    rawOptions,
    type: typeof rawOptions
  });
  
  try {
    // Handle string format (could be JSON string or direct string)
    if (typeof rawOptions === 'string') {
      try {
        // First, try parsing as JSON
        const parsed = JSON.parse(rawOptions);
        
        // If parsed result is an array, map directly
        if (Array.isArray(parsed)) {
          parsedOptions = parsed.map(normalizeOption);
        } 
        // If parsed result is an object, extract values
        else if (parsed && typeof parsed === 'object') {
          parsedOptions = Object.values(parsed).map(normalizeOption);
        }
        // If parsing fails, treat as a comma-separated or space-separated string
        else {
          parsedOptions = rawOptions
            .split(/[,\s]+/)
            .map(opt => normalizeOption(opt.trim()));
        }
      } catch (e) {
        // If JSON parsing fails, split the string
        parsedOptions = rawOptions
          .replace(/^\[|\]$/g, '') // Remove square brackets if present
          .split(/[,\s]+/)
          .map(opt => normalizeOption(opt.trim()));
      }
    } 
    // Handle array format
    else if (Array.isArray(rawOptions)) {
      parsedOptions = rawOptions.map(normalizeOption);
    } 
    // Handle object format
    else if (rawOptions && typeof rawOptions === 'object') {
      parsedOptions = Object.values(rawOptions as Record<string, unknown>).map(normalizeOption);
    }
    
    // Fallback if no options parsed
    if (parsedOptions.length === 0) {
      // Create options based on correct answer or generate defaults
      if (question.correctOption) {
        parsedOptions = [
          { id: 'A', text: question.correctOption },
          { id: 'B', text: 'Option B' },
          { id: 'C', text: 'Option C' },
          { id: 'D', text: 'Option D' }
        ];
      } else {
        // Absolute last resort
        parsedOptions = [
          { id: '1', text: 'Option 1' },
          { id: '2', text: 'Option 2' },
          { id: '3', text: 'Option 3' },
          { id: '4', text: 'Option 4' }
        ];
      }
    }
    
    // Ensure unique IDs
    parsedOptions = ensureUniqueOptionIds(parsedOptions);
    
  } catch (e) {
    console.error(`Error processing options for question ${question.id}:`, e);
    // Fallback to default options
    parsedOptions = [
      { id: '1', text: 'Option 1' },
      { id: '2', text: 'Option 2' },
      { id: '3', text: 'Option 3' },
      { id: '4', text: 'Option 4' }
    ];
  }
  
  // Log final parsed options
  console.log(`Parsed options for question ${question.id}:`, parsedOptions);
  
  // Return the processed question with normalized options
  return {
    ...question,
    options: parsedOptions
  };
}// Debugging function to help identify option parsing issues
export function debugQuestionOptions(question: Question) {
  console.log('Debugging Question Options:');
  console.log('Question ID:', question.id);
  console.log('Raw Options:', question.options);
  console.log('Options Type:', typeof question.options);
  
  if (question.options === null) {
    console.warn('WARNING: Options are null');
  }
  
  if (question.options === undefined) {
    console.warn('WARNING: Options are undefined');
  }
  
  try {
    // Force parsing to see what happens
    const parsed = parseQuestionOptions(question);
    console.log('Parsed Options:', parsed.options);
  } catch (error) {
    console.error('Parsing Error:', error);
  }
}

// Additional helper to forcibly create minimal options if parsing fails
export function createFallbackOptions(question: Question): ProcessedQuestion {
  return {
    ...question,
    options: [
      { 
        id: 'fallback_1', 
        text: 'Option 1' 
      },
      { 
        id: 'fallback_2', 
        text: 'Option 2' 
      },
      { 
        id: 'fallback_3', 
        text: 'Option 3' 
      },
      { 
        id: 'fallback_4', 
        text: 'Option 4' 
      }
    ]
  };
}

// Enhanced option parsing with more robust error handling
export function robustParseQuestionOptions(question: Question): ProcessedQuestion {
  // Log raw options for debugging
  console.log(`Parsing options for question ${question.id}:`, {
    rawOptions: question.options,
    type: typeof question.options
  });

  try {
    // Handle different potential input formats
    let optionsToProcess = question.options;

    // If it's a string, try parsing
    if (typeof optionsToProcess === 'string') {
      try {
        optionsToProcess = JSON.parse(optionsToProcess);
      } catch (parseError) {
        console.warn(`Failed to parse options string for question ${question.id}:`, parseError);
      }
    }

    // Ensure we have a valid options array or object
    if (!optionsToProcess || 
        (typeof optionsToProcess !== 'object' && !Array.isArray(optionsToProcess))) {
      console.warn(`Invalid options format for question ${question.id}. Using fallback.`);
      return createFallbackOptions(question);
    }

    // First, try standard parsing
    const parsed = parseQuestionOptions({
      ...question,
      options: optionsToProcess
    });
    
    // If no options are found, use fallback
    if (parsed.options.length === 0) {
      console.warn(`No options found for question ${question.id}. Using fallback.`);
      return createFallbackOptions(question);
    }
    
    return parsed;
  } catch (error) {
    console.error(`Critical error parsing options for question ${question.id}:`, error);
    return createFallbackOptions(question);
  }
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