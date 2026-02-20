/**
 * Priority color system - single source of truth
 * Colors match Notion-style priority selector
 */
export const PRIORITY_COLORS = {
  Low: {
    bg: 'rgba(34, 197, 94, 0.20)',     // soft green bg
    text: 'rgb(20 ,184 ,138,1)',        // strong green text
  },
  Medium: {
    bg: 'rgba(251, 191, 36, 0.20)',    // soft yellow bg
    text: 'rgb(240, 144, 86,1)',      // strong amber text
  },
High: {
  bg: 'rgba(255, 59, 59, 0.12)',   // violet (no red tone)
  text: '#FF3B3B',     // deep violet text
},
} as const;


export type PriorityValue = 'Low' | 'Medium' | 'High';

export const getPriorityColor = (
  priority: string
): { bg: string; text: string } => {
  const normalizedPriority =
    priority?.charAt(0).toUpperCase() + priority?.slice(1).toLowerCase();

  switch (normalizedPriority) {
    case 'Low':
      return PRIORITY_COLORS.Low;
    case 'Medium':
      return PRIORITY_COLORS.Medium;
    case 'High':
      return PRIORITY_COLORS.High;
    default:
      return PRIORITY_COLORS.Medium;
  }
};

export const PRIORITY_OPTIONS: PriorityValue[] = ['Low', 'Medium', 'High'];

/**
 * Get custom priority names from localStorage
 */
export const getCustomPriorityNames = (projectId?: string): Partial<Record<PriorityValue, string>> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const storageKey = projectId ? `priorityCustomNames_${projectId}` : 'priorityCustomNames';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading custom priority names:', e);
  }
  
  return {};
};

/**
 * Get display name for a priority (custom name if available, otherwise default)
 */
export const getPriorityDisplayName = (priority: string, projectId?: string): string => {
  const customNames = getCustomPriorityNames(projectId);
  const normalizedPriority = priority?.charAt(0).toUpperCase() + priority?.slice(1).toLowerCase() as PriorityValue;
  return customNames[normalizedPriority] || priority || 'Medium';
};

/**
 * Get custom field title from localStorage
 */
export const getPriorityFieldTitle = (projectId?: string): string => {
  if (typeof window === 'undefined') return 'Priority';
  
  try {
    const storageKey = projectId ? `priorityFieldTitle_${projectId}` : 'priorityFieldTitle';
    const saved = localStorage.getItem(storageKey);
    return saved || 'Priority';
  } catch (e) {
    return 'Priority';
  }
};

