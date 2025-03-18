/**
 * Utility functions for handling LaTeX content.
 */

/**
 * Checks if the given text might contain LaTeX expressions.
 * @param text - The text to check.
 * @returns True if the text contains LaTeX-like patterns, false otherwise.
 */
export const mightContainLatex = (text: string): boolean => {
    return text.includes('$') ||
           text.includes('\\') ||
           text.includes('{') ||
           text.includes('}');
};

/**
 * Processes a formula to ensure it has the correct LaTeX delimiters.
 * @param input - The formula to process.
 * @param inline - Whether the formula should be inline or block.
 * @returns The processed formula with appropriate delimiters.
 */
export const processFormula = (input: string, inline: boolean): string => {
    const hasDelimiters =
        (input.startsWith('$') && input.endsWith('$')) ||
        (input.startsWith('$$') && input.endsWith('$$')) ||
        (input.startsWith('\\(') && input.endsWith('\\)')) ||
        (input.startsWith('\\[') && input.endsWith('\\]'));

    if (hasDelimiters) {
        return input;
    }

    return inline ? `$${input}$` : `$$${input}$$`;
};
