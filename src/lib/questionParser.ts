// src/utils/questionParser.ts

/**
 * Represents a single option in a quiz question
 */
export type Option = {
  id: string;
  text: string;
};

/**
 * Represents the raw question data before processing
 */
export type Question = {
  id: number;
  question: string;
  options: unknown; // Flexible type to handle various input formats
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

/**
 * Represents a processed question with normalized options
 */
export type ProcessedQuestion = Omit<Question, 'options'> & {
  options: Option[];
};

/**
 * Type guard to determine if the input is a string
 */
function isString(input: unknown): input is string {
  return typeof input === 'string';
}

/**
 * Type guard to determine if the input is a string array
 */
function isStringArray(input: unknown): input is string[] {
  return Array.isArray(input) && input.every(item => typeof item === 'string');
}

/**
 * Type guard to determine if the input is a record of unknown values
 */
function isRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === 'object' && !Array.isArray(input);
}

/**
 * Safely convert a value to a string, with fallback options
 */
function safeString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

/**
 * Normalize an option to ensure it has id and text properties
 */
function normalizeOption(input: unknown): Option {
  // Direct string input
  if (typeof input === 'string') {
    return { id: input, text: input };
  }

  // Primitive values
  if (input === null || input === undefined) {
    return { id: '', text: '' };
  }

  // Handle primitive types
  if (typeof input === 'number' || typeof input === 'boolean') {
    const str = String(input);
    return { id: str, text: str };
  }

  // Object-like input
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    
    // Try to extract id and text from various possible keys
    const extractors = [
      () => ({
        id: safeString(obj.id || obj.key || obj.value),
        text: safeString(obj.text || obj.label || obj.content)
      }),
      // Fallback to converting the entire object
      () => ({
        id: safeString(JSON.stringify(obj)),
        text: safeString(JSON.stringify(obj))
      })
    ];

    // Find the first extractor that produces a non-empty result
    for (const extract of extractors) {
      const option = extract();
      if (option.id || option.text) return option;
    }
  }

  // Absolute fallback
  return { 
    id: safeString(input, 'unknown'), 
    text: safeString(input, 'Unknown Option') 
  };
}

/**
 * Ensure unique IDs for options
 */
function ensureUniqueOptionIds(options: Option[]): Option[] {
  const seen = new Set<string>();
  
  return options.map(opt => {
    let id = opt.id;
    let counter = 1;
    
    // Modify ID if it's already been seen
    while (seen.has(id)) {
      id = `${opt.id}_${counter++}`;
    }
    
    seen.add(id);
    return { ...opt, id };
  });
}

/**
 * Parse options from various input formats
 */
function parseOptionsFromInput(input: unknown): Option[] {
  let parsedOptions: Option[] = [];

  // Try different parsing strategies
  const parsingStrategies = [
    // Strategy 1: Direct string array
    () => isStringArray(input) ? input.map(normalizeOption) : null,

    // Strategy 2: String input (JSON or comma-separated)
    () => {
      if (!isString(input)) return null;
      
      try {
        // Try parsing as JSON
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) 
          ? parsed.map(normalizeOption)
          : isRecord(parsed)
            ? Object.values(parsed).map(normalizeOption)
            : null;
      } catch {
        // Fallback to comma/space-separated string
        return input
          .replace(/^\[|\]$/g, '')
          .split(/[,\s]+/)
          .map(opt => normalizeOption(opt.trim()));
      }
    },

    // Strategy 3: Object with values
    () => isRecord(input) 
      ? Object.values(input).map(normalizeOption)
      : null,

    // Strategy 4: Array of unknown type
    () => Array.isArray(input) 
      ? input.map(normalizeOption)
      : null
  ];

  // Find the first successful parsing strategy
  for (const strategy of parsingStrategies) {
    const result = strategy();
    if (result && result.length > 0) {
      parsedOptions = result;
      break;
    }
  }

  // Fallback if no options parsed
  return parsedOptions.length > 0 
    ? ensureUniqueOptionIds(parsedOptions)
    : [
        { id: 'A', text: 'Option A' },
        { id: 'B', text: 'Option B' },
        { id: 'C', text: 'Option C' },
        { id: 'D', text: 'Option D' }
      ];
}

/**
 * Process a single question, normalizing its options
 */
export function parseQuestionOptions(question: Question): ProcessedQuestion {
  try {
    // Log input for debugging
    console.log(`Processing options for question ${question.id}`, {
      rawOptions: question.options,
      type: typeof question.options
    });

    // Parse options
    const parsedOptions = parseOptionsFromInput(question.options);

    // Log final parsed options
    console.log(`Parsed options for question ${question.id}:`, parsedOptions);

    // Return processed question
    return {
      ...question,
      options: parsedOptions
    };
  } catch (error) {
    // Critical error fallback
    console.error(`Critical error processing options for question ${question.id}:`, error);
    
    return {
      ...question,
      options: [
        { id: '1', text: 'Option 1' },
        { id: '2', text: 'Option 2' },
        { id: '3', text: 'Option 3' },
        { id: '4', text: 'Option 4' }
      ]
    };
  }
}

/**
 * Debugging function to help identify option parsing issues
 */
export function debugQuestionOptions(question: Question): void {
  console.group(`Debugging Question Options (ID: ${question.id})`);
  
  try {
    console.log('Raw Options:', question.options);
    console.log('Options Type:', typeof question.options);

    // Attempt parsing
    const parsed = parseQuestionOptions(question);
    console.log('Parsed Options:', parsed.options);
  } catch (error) {
    console.error('Unexpected error in debugQuestionOptions:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Process all questions in a subtopic
 */
export function processSubtopicQuestions(questions: Question[]): ProcessedQuestion[] {
  return questions.map(parseQuestionOptions);
}