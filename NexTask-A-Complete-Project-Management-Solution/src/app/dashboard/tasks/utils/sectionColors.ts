/**
 * Section background color system - colors for task sections/columns
 * Based on section names to match the UI design
 * Custom sections get random pastel colors
 */

// Pastel color palette for custom sections - excludes colors used for standard sections
const PASTEL_COLORS = [
  '#F0F9FF', // Sky blue
  '#F5F0FF', // Lavender
  '#FFF0F5', // Pink
  '#F0FFF4', // Mint
  '#FFFBF0', // Cream
  '#FCE7F3', // Light pink
  '#CCFBF1', // Light teal
  '#DBEAFE', // Light blue
  '#F3E8FF', // Light purple
  '#FFE4E6', // Light rose
  '#E0F2FE', // Light sky
  '#F3F4F6', // Light gray
  '#E5E7EB', // Light stone
  '#FEF9E3', // Light yellow (different shade)
  '#E8F4F8', // Light cyan
  '#F5E6FF', // Light violet
];

/**
 * Generate a consistent pastel color for a custom section based on its name
 * @param sectionName - The name of the section
 * @returns A pastel background color hex code
 */
const getRandomPastelColor = (sectionName: string): string => {
  // Convert section name to a hash for consistent color assignment
  let hash = 0;
  for (let i = 0; i < sectionName.length; i++) {
    const char = sectionName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
};

/**
 * Get background color for a task section based on its name
 * @param sectionName - The name of the section (e.g., "To Do", "In Progress", "Completed")
 * @param sectionId - Optional section ID for consistent color assignment
 * @returns A background color hex code
 */
export const getSectionBackgroundColor = (
  sectionName: string | undefined,
  sectionId?: string | undefined
): string => {
  if (!sectionName) {
    return '#F5F5F5'; // Default grayish
  }

  const nameLower = sectionName.toLowerCase().trim();

  // To Do / Todo / Pending
  if (nameLower.includes('todo') || nameLower.includes('to do') || nameLower.includes('pending')) {
    return '#F5F5F5'; // Grayish background
  }

  // In Progress
  if (nameLower.includes('progress') || nameLower.includes('in progress')) {
    return '#FFF9E6'; // Light yellow
  }

  // Completed / Done
  if (nameLower.includes('completed') || nameLower.includes('done') || nameLower.includes('complete')) {
    return '#E8F5E9'; // Light green
  }

  // In Review
  if (nameLower.includes('review') || nameLower.includes('in review')) {
    return '#E3F2FD'; // Light blue
  }

  // For custom sections, use section ID if available for more consistent coloring,
  // otherwise use section name
  const identifier = sectionId || sectionName;
  return getRandomPastelColor(identifier);
};

