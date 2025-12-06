/**
 * Truncates a given text to a maximum length.
 * If the text is shorter than or equal to the maximum length, it is returned unchanged.
 * If the text is longer than the maximum length, it is truncated to the maximum length
 * and "... " is appended to the end.
 *
 * @param {string} text The text to truncate.
 * @param {number} [maxLength=100] The maximum length of the truncated text.
 * @returns {string} The truncated text.
 */
export const truncateText = (text: string, maxLength = 100): string => {
  if (!text) {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};
