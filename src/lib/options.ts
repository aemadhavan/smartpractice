// src/utils/optionParser.ts

/**
 * Option type definition
 */
export type Option = {
  id: string;
  text: string;
};

// Define a RawOption interface to use instead of 'any'
interface RawOption {
  id?: string;
  text?: string;
  [key: string]: unknown;
}

// Define a Question interface to use instead of 'any'
interface Question {
  options: unknown;
  [key: string]: unknown;
}

/**
 * Utility to normalize options from various formats to the standard Option[] format
 * Handles JSON strings, arrays of strings, and existing Option objects
 * 
 * @param rawOptions - Options in any format
 * @returns Normalized array of Option objects with id and text properties
 */
export const normalizeOptions = (rawOptions: unknown): Option[] => {
  // If no options provided, return empty array
  if (!rawOptions) {
    return [];
  }
  
  // If already an array of Option objects
  if (Array.isArray(rawOptions) && 
      rawOptions.length > 0 && 
      typeof rawOptions[0] === 'object' && 
      rawOptions[0] !== null &&
      'id' in rawOptions[0] && 
      'text' in rawOptions[0]) {
    
    // Ensure the ids are properly formatted (o1:, o2:, etc.)
    return rawOptions.map((option: RawOption, index) => ({
      id: typeof option.id === 'string' && option.id.match(/^o\d+:/) 
        ? option.id 
        : `o${index + 1}:${option.text}`,
      text: String(option.text || '')
    }));
  }
  
  // If it's a string, try to parse as JSON
  if (typeof rawOptions === 'string') {
    try {
      const parsed = JSON.parse(rawOptions);
      
      // If parsed is an array, process it
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => {
          // If item is an object with text property
          if (typeof item === 'object' && item !== null && 'text' in item) {
            return {
              id: `o${index + 1}:${item.text}`,
              text: String(item.text)
            };
          }
          
          // Otherwise, use the item itself as text
          const itemText = typeof item === 'string' ? item : String(item);
          return {
            id: `o${index + 1}:${itemText}`,
            text: itemText
          };
        });
      }
      
      // If parsed is an object but not an array, convert object values to options
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.values(parsed).map((value, index) => {
          const valueText = typeof value === 'string' ? value : String(value);
          return {
            id: `o${index + 1}:${valueText}`,
            text: valueText
          };
        });
      }
    } catch {
      // If parsing fails, treat as comma-separated string
      return rawOptions
        .split(',')
        .map(opt => opt.trim())
        .filter(Boolean)
        .map((opt, index) => ({
          id: `o${index + 1}:${opt}`,
          text: opt
        }));
    }
  }
  
  // If it's an array of other types (strings, numbers, etc.)
  if (Array.isArray(rawOptions)) {
    return rawOptions.map((item, index) => {
      const itemText = typeof item === 'string' ? item : String(item);
      return {
        id: `o${index + 1}:${itemText}`,
        text: itemText
      };
    });
  }
  
  // If it's any other object, convert its values to options
  if (typeof rawOptions === 'object' && rawOptions !== null) {
    return Object.values(rawOptions).map((value, index) => {
      const valueText = typeof value === 'string' ? value : String(value);
      return {
        id: `o${index + 1}:${valueText}`,
        text: valueText
      };
    });
  }
  
  // Last resort: treat as a single value
  const valueText = String(rawOptions);
  return [
    {
      id: `o1:${valueText}`,
      text: valueText
    }
  ];
};

/**
 * Extracts the option text from an option ID
 * Removes prefix like "o1:", "o2:", etc.
 * 
 * @param optionId - The option ID, possibly with a prefix
 * @returns The pure option text without prefix
 */
export const extractOptionText = (optionId: string): string => {
  if (!optionId) return '';
  
  const match = optionId.match(/^o\d+:(.*)/);
  return match ? match[1] : optionId;
};

/**
 * Formats options for API submission
 * Converts from Option[] format to a JSON-ready array of objects
 * 
 * @param options - Array of Option objects
 * @returns Formatted options ready for API submission
 */
export const formatOptionsForAPI = (options: Option[]): { id: string; text: string }[] => {
  if (!options || !Array.isArray(options)) {
    return [];
  }
  
  return options.map((option, index) => ({
    id: `o${index + 1}`,
    text: option.text
  }));
};

/**
 * Process question options from the API response
 * Ensures options are in the standard format for rendering
 * 
 * @param question - The question object from the API
 * @returns Question with standardized options
 */
export const processQuestionOptions = (question: Question): Question => {
  if (!question) return null as unknown as Question;
  
  const processedOptions = normalizeOptions(question.options);
  
  return {
    ...question,
    options: processedOptions
  };
};

/**
 * Special handling for currency values and other complex text formats
 * 
 * @param optionText - The raw option text
 * @returns Formatted option text ready for display
 */
export const formatOptionText = (optionText: string): string => {
  // Make sure we have a string
  if (typeof optionText !== 'string') {
    return String(optionText);
  }
  
  // First remove any prefixes (o1:, o2:, etc.)
  let cleanedText = extractOptionText(optionText).trim();
  
  // Special handling for currency values
  if (cleanedText.includes('$')) {
    // This regex identifies currency patterns with commas
    const currencyRegex = /\$\d{1,3}(,\d{3})+(\.\d+)?/g;
    const currencyValues = cleanedText.match(currencyRegex) || [];
    
    // Create placeholders for currency values to protect them
    const placeholders: {[key: string]: string} = {};
    currencyValues.forEach((value, index) => {
      const placeholder = `__CURRENCY_${index}__`;
      placeholders[placeholder] = value;
      cleanedText = cleanedText.replace(value, placeholder);
    });
    
    // Process other formatting
    cleanedText = cleanedText
      .replace(/(\d+)(\$\d+)/g, '$1, $2')
      .replace(/^(\d+)(\$\d+)/g, '$1, $2')
      .replace(/,([^\s\d])/g, ', $1');
    
    // Restore currency values
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      cleanedText = cleanedText.replace(placeholder, value);
    });
  } else {
    // General formatting for non-currency values
    cleanedText = cleanedText
      .replace(/,([^\s\d])/g, ', $1')
      .replace(/(\d+)(\.\d+)?$/g, '$1$2');
  }
  
  return cleanedText;
};

/**
 * Check if the user's answer is correct
 * 
 * @param selectedOptionId - ID of the selected option
 * @param options - Array of all available options
 * @param correctAnswer - The text of the correct answer
 * @returns Boolean indicating if the answer is correct
 */
export const isAnswerCorrect = (
  selectedOptionId: string, 
  options: Option[], 
  correctAnswer: string
): boolean => {
  // Find the selected option
  const selectedOption = options.find(opt => opt.id === selectedOptionId);
  
  // If no option found, it can't be correct
  if (!selectedOption) return false;
  
  // Compare the text value with the correct answer
  return selectedOption.text === correctAnswer;
};