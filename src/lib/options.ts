// File: /src/lib/options.ts

/**
 * Option type definition for quiz options
 */
export type Option = {
  id: string;
  text: string;
};

/**
 * Converts a raw DB options value to a standard string[] format
 * Handles various input formats and ensures we have a proper array
 * 
 * @param rawOptions - The raw options value from the database
 * @returns Normalized string array of options
 */
export const normalizeOptionsFromDB = (rawOptions: unknown): string[] => {
  // If options is undefined or null, return empty array
  if (rawOptions === null || rawOptions === undefined) {
    return [];
  }

  // If it's already a string array, return it directly
  if (Array.isArray(rawOptions) && 
      rawOptions.every(item => typeof item === 'string')) {
    return rawOptions;
  }

  // If it's a string, try parsing as JSON
  if (typeof rawOptions === 'string') {
    try {
      const parsed = JSON.parse(rawOptions);
      if (Array.isArray(parsed)) {
        // Convert any non-string values to strings
        return parsed.map(item => String(item));
      }
    } catch (e) {
      // If not valid JSON, split by comma
      return rawOptions.split(',').map(opt => opt.trim()).filter(Boolean);
    }
  }

  // For non-string arrays, convert to string array
  if (Array.isArray(rawOptions)) {
    return rawOptions.map(item => String(item));
  }

  // For objects, convert values to array
  if (typeof rawOptions === 'object' && rawOptions !== null) {
    return Object.values(rawOptions).map(val => String(val));
  }

  // Fallback: treat as single value
  return [String(rawOptions)];
};

/**
 * Parses an options array or string and formats it consistently for the quiz application
 * Handles various input formats and adds consistent prefixes for tracking
 * 
 * @param options - Array of options or comma-separated string of options
 * @returns Array of options with consistent o1:, o2: prefixes
 */
export const parseOptionsArray = (options: string | string[] | Record<string, unknown> | Option[]): Option[] => {
  // If input is already null or undefined, return empty array
  if (!options) return [];

  let optionStrings: string[] = [];
  
  // First, normalize options to a string array
  if (typeof options === 'string') {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) {
        optionStrings = parsed.map(item => String(item));
      } else {
        // If parsed but not an array, use comma splitting
        optionStrings = options.split(',').map(opt => opt.trim()).filter(Boolean);
      }
    } catch (e) {
      // Not valid JSON, use comma splitting with special case handling
      if (options.includes('$') && options.includes(',')) {
        // Special handling for currency values (keep existing code)
        const currencyRegex = /\$\d{1,3}(,\d{3})+(\.\d+)?|\$\d+(\.\d+)?/g;
        const currencyValues = options.match(currencyRegex) || [];
        
        if (currencyValues && currencyValues.length > 0) {
          // Create temporary placeholders for currency values
          let processedOptions = options;
          const placeholders: {[key: string]: string} = {};
          
          currencyValues.forEach((value, index) => {
            const placeholder = `__CURRENCY_${index}__`;
            placeholders[placeholder] = value;
            processedOptions = processedOptions.replace(value, placeholder);
          });
          
          // Split safely on commas that aren't inside currency values
          optionStrings = processedOptions.split(/(?<!\d),(?!\d)/)
            .map(o => o.trim())
            .filter(Boolean);
          
          // Restore the currency values from placeholders
          optionStrings = optionStrings.map(opt => {
            let restored = opt;
            Object.entries(placeholders).forEach(([placeholder, value]) => {
              restored = restored.replace(placeholder, value);
            });
            return restored.trim();
          });
        }
      } else {
        // Regular comma splitting
        optionStrings = options.split(',').map(opt => opt.trim()).filter(Boolean);
      }
    }
  } else if (Array.isArray(options)) {
    // Handle array format - check if it's an array of Option objects
    if (options.length > 0 && typeof options[0] === 'object' && options[0] !== null) {
      optionStrings = options.map(opt => {
        if (typeof opt === 'string') return opt.trim();
        
        if (opt && typeof opt === 'object') {
          // Extract from Option objects
          if ('text' in opt && typeof opt.text === 'string') {
            return String(opt.text).trim();
          }
          if ('id' in opt && typeof opt.id === 'string') {
            return extractOptionValue(String(opt.id)).trim();
          }
          if ('value' in opt) {
            return String(opt.value).trim();
          }
        }
        
        return String(opt).trim();
      });
    } else {
      // Simple array of values
      optionStrings = options.map(opt => String(opt).trim());
    }
  } else if (options && typeof options === 'object') {
    // Handle object format
    optionStrings = Object.values(options).map(value => String(value).trim());
  }

  // Convert to Option objects
  const parsedOptions = optionStrings.map(str => ({
    id: str,
    text: str
  }));
  
  // Ensure we have some options
  if (parsedOptions.length === 0) {
    return [];
  }
  
  // Add option identifiers (o1:, o2:, etc.)
  return parsedOptions.map((option, index) => {
    // If the option id already has a prefix like o1:, o2:, etc., keep it as is
    if (String(option.id).match(/^o\d+:/)) {
      return option;
    }
    
    // Otherwise, add the prefix
    return {
      id: `o${index + 1}:${option.id}`,
      text: option.text
    };
  });
};

/**
 * Helper function to extract the option value regardless of prefix format
 * Ensures consistent comparison between options with different prefix formats
 * 
 * @param opt - Option string which may or may not have a prefix
 * @returns The option value without prefix
 */
export const extractOptionValue = (opt: string): string => {
  if (!opt) return '';
  const match = String(opt).match(/^o\d+:(.*)/);
  return match ? match[1].trim() : String(opt).trim();
};

/**
 * Renders option text for display by stripping prefixes and formatting appropriately
 * 
 * @param optionText - The option text which may include a prefix
 * @returns Formatted option text ready for display
 */
export const renderOptionText = (optionText: string): string => {
  // Make sure we have a string
  if (typeof optionText !== 'string') {
    return String(optionText);
  }
  
  // First check if the option has the prefix format (o1:, o2:, etc.)
  const prefixMatch = optionText.match(/^o\d+:(.*)/);
  if (prefixMatch && prefixMatch[1]) {
    // Extract just the actual option text after the prefix
    optionText = prefixMatch[1].trim();
  }
  
  // Further formatting logic
  let cleanedText = optionText.trim();
  
  // Special handling for currency values
  if (cleanedText.includes('$')) {
    // This regex identifies currency patterns with commas and preserves them
    const currencyRegex = /\$\d{1,3}(,\d{3})+(\.\d+)?/g;
    const currencyValues = cleanedText.match(currencyRegex) || [];
    
    // Create temporary placeholders for currency values to protect them during processing
    const placeholders: {[key: string]: string} = {};
    currencyValues.forEach((value, index) => {
      const placeholder = `__CURRENCY_${index}__`;
      placeholders[placeholder] = value;
      cleanedText = cleanedText.replace(value, placeholder);
    });
    
    // Process other formatting that's safe to do
    cleanedText = cleanedText
      // Fix spacing around remaining currency values (those without commas)
      .replace(/(\d+)(\$\d+)/g, '$1, $2')
      .replace(/^(\d+)(\$\d+)/g, '$1, $2')
      // Fix spacing after commas that aren't inside currency numbers
      .replace(/,([^\s\d])/g, ', $1');
    
    // Restore the currency values from placeholders
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      cleanedText = cleanedText.replace(placeholder, value);
    });
  } else {
    // If no currency values, apply general spacing fixes
    cleanedText = cleanedText
      // Fix spacing after commas that aren't inside numbers
      .replace(/,([^\s\d])/g, ', $1')
      // Special case for truncated decimal numbers
      .replace(/(\d+)(\.\d+)?$/g, '$1$2');
  }
  
  return cleanedText;
};

/**
 * Prepares options data for database storage
 * Removes prefixes and converts to a proper JSON string
 * 
 * @param options - Array of options with prefixes
 * @returns JSON string representation of option values, ready for database storage
 */
export const prepareOptionsForStorage = (options: Option[]): string => {
  if (!options || !Array.isArray(options)) return '[]';
  
  const optionValues = options.map(option => extractOptionValue(option.id));
  return JSON.stringify(optionValues);
};

/**
 * Converts database option array to Option objects with prefixes
 * 
 * @param dbOptions - Array of option values from the database or JSON string
 * @returns Array of Option objects with proper prefixes
 */
export const dbOptionsToDisplayOptions = (dbOptions: string | string[]): Option[] => {
  let optionsArray: string[] = [];
  
  if (typeof dbOptions === 'string') {
    try {
      // Try to parse as JSON string
      const parsed = JSON.parse(dbOptions);
      if (Array.isArray(parsed)) {
        optionsArray = parsed.map(opt => String(opt));
      } else {
        // If parsed but not an array
        optionsArray = [String(parsed)];
      }
    } catch (e) {
      // Not valid JSON, treat as comma-separated
      optionsArray = dbOptions.split(',').map(opt => opt.trim()).filter(Boolean);
    }
  } else if (Array.isArray(dbOptions)) {
    optionsArray = dbOptions.map(opt => String(opt));
  } else if (dbOptions === null || dbOptions === undefined) {
    return [];
  } else {
    // For any other type
    optionsArray = [String(dbOptions)];
  }
  
  return optionsArray.map((opt, index) => ({
    id: `o${index + 1}:${opt}`,
    text: opt
  }));
};