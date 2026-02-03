/**
 * Project color palette system - generates pastel colors for projects
 * Uses a consistent color based on project ID
 */

// Pastel color palette - soft, muted colors
const PASTEL_COLORS = [
  '#F0F9FF', // Sky blue
  '#F5F0FF', // Lavender
  '#FFF0F5', // Pink
  '#F0FFF4', // Mint
  '#FFFBF0', // Cream
  '#F0FDF4', // Light green
  '#FEF3C7', // Light yellow
  '#E0E7FF', // Light indigo
  '#FCE7F3', // Light pink
  '#CCFBF1', // Light teal
  '#DBEAFE', // Light blue
  '#F3E8FF', // Light purple
  '#FFE4E6', // Light rose
  '#E0F2FE', // Light sky
  '#F3F4F6', // Light gray
  '#E5E7EB', // Light stone
];

/**
 * Generate a consistent pastel color for a project based on its ID
 * @param projectId - The project ID (string or number)
 * @returns A pastel background color hex code
 */
export const getProjectColor = (projectId: string | number | undefined): string => {
  if (!projectId) {
    return PASTEL_COLORS[0]; // Default to first color
  }

  // Convert projectId to a number for consistent hashing
  const idString = String(projectId);
  let hash = 0;
  for (let i = 0; i < idString.length; i++) {
    const char = idString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
};

