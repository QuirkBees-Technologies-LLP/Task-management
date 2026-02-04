/**
 * Section background color system - colors for task sections/columns
 * Based on section names to match the UI design
 * Custom sections get random pastel colors
 */

// Pastel color palette for custom sections - excludes colors used for standard sections
// Pastel colors optimized for DARK MODE (rgba only)
const PASTEL_COLORS = [
  'rgba(186, 230, 253, 0.1)', // Sky blue
  'rgba(216, 180, 254, 0.1)', // Lavender
  'rgba(251, 182, 206, 0.1)', // Pink
  'rgba(167, 243, 208, 0.1)', // Mint
  'rgba(254, 240, 138, 0.1)', // Cream
  'rgba(251, 207, 232, 0.1)', // Light pink
  'rgba(153, 246, 228, 0.1)', // Light teal
  'rgba(191, 219, 254, 0.1)', // Light blue
  'rgba(233, 213, 255, 0.1)', // Light purple
  'rgba(254, 205, 211, 0.1)', // Light rose
  'rgba(186, 230, 253, 0.1)', // Light sky
  'rgba(209, 213, 219, 0.1)', // Light gray
  'rgba(209, 213, 219, 0.1)', // Light stone
  'rgba(234, 179, 8, 0.1)',  // Light yellow
  'rgba(165, 243, 252, 0.1)', // Light cyan
  'rgba(221, 214, 254, 0.1)', // Light violet
];

/**
 * Generate a consistent pastel color for a custom section based on its name
 * @param sectionName - The name of the section
 * @returns A pastel background color hex code
 */
const getRandomPastelColor = (sectionName: string): string => {
  let hash = 0;

  for (let i = 0; i < sectionName.length; i++) {
    hash = ((hash << 5) - hash) + sectionName.charCodeAt(i);
    hash |= 0;
  }

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
  sectionId?: string
): string => {
  if (!sectionName) {
    return 'rgba(148, 163, 184, 0.1)'; // default neutral dark gray
  }

  const nameLower = sectionName.toLowerCase().trim();

  // To Do / Pending
  if (nameLower.includes('todo') || nameLower.includes('to do') || nameLower.includes('pending')) {
    return 'rgba(148, 163, 184, 0.1)'; // neutral gray
  }

  // In Progress
  if (nameLower.includes('progress')) {
    return 'rgba(234, 179, 8, 0.1)'; // yellow (warning soft)
  }

  // Completed / Done
  if (nameLower.includes('completed') || nameLower.includes('done') || nameLower.includes('complete')) {
    return 'rgba(34, 197, 94, 0.1)'; // green success
  }

  // In Review
  if (nameLower.includes('review')) {
    return 'rgba(59, 130, 246, 0.1)'; // blue info
  }

  // Custom sections
  const identifier = sectionId || sectionName;
  return getRandomPastelColor(identifier);
};


