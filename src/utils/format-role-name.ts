/**
 * Format role name from camelCase to Title Case with spaces
 * Examples: "projectManager" -> "Project Manager", "admin" -> "Admin"
 */
const WORD_SEPARATOR_REGEX = /[\s_-]+/;

export function formatRoleName(name: string): string {
  if (!name) {
    return '';
  }
  // Add space before capital letters and split
  const words = name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(WORD_SEPARATOR_REGEX);

  // Capitalize first letter of each word
  return words
    ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
