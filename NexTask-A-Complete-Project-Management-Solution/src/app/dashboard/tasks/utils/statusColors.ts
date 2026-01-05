/**
 * Status color system - single source of truth
 * Colors for status options (customizable)
 * NOTE: Intentionally different from the priority palette to avoid overlap.
 */
export const STATUS_COLORS_EXTENDED = [
  { bg: '#DBEAFE', text: '#1E3A8A' }, // Blue
  { bg: '#E0E7FF', text: '#3730A3' }, // Indigo
  { bg: '#CCFBF1', text: '#0F766E' }, // Teal
  { bg: '#FFE4E6', text: '#BE123C' }, // Rose
  { bg: '#F3E8FF', text: '#7E22CE' }, // Purple
  { bg: '#E0F2FE', text: '#075985' }, // Sky
  { bg: '#E5E7EB', text: '#374151' }, // Gray
  { bg: '#FCE7F3', text: '#9D174D' }, // Pink
  { bg: '#F3F4F6', text: '#111827' }, // Stone
  { bg: '#C7D2FE', text: '#312E81' }, // Deep Indigo
];

export type StatusValue = string;

// Default status options and their distinct (non-priority) colors
const DEFAULT_STATUS_ENTRIES = [
  { value: 'Todo', name: 'Todo', color: { bg: '#DBEAFE', text: '#1E3A8A' } }, // Blue
  { value: 'In Progress', name: 'In Progress', color: { bg: '#E0E7FF', text: '#3730A3' } }, // Indigo
  { value: 'Done', name: 'Done', color: { bg: '#CCFBF1', text: '#0F766E' } }, // Teal
] as const;

export const DEFAULT_STATUS_OPTIONS: StatusValue[] = DEFAULT_STATUS_ENTRIES.map((o) => o.value);

/**
 * Get status color from localStorage or default
 */
const PRIORITY_BG_SET = new Set([
  '#d1fae5'.toLowerCase(), // Low
  '#fef3c7'.toLowerCase(), // Medium
  '#e9d5ff'.toLowerCase(), // High
]);

/**
 * Get status color from localStorage or default
 */
export const getStatusColor = (status: string, projectId?: string): { bg: string; text: string } => {
  if (!status) {
    return { bg: '#D1D5DB', text: '#374151' }; // Default gray
  }

  // Try to get color from localStorage (project-specific if projectId provided)
  if (typeof window !== 'undefined') {
    try {
      const storageKey = projectId ? `statusOptions_${projectId}` : 'statusOptions';
      const savedOptions = localStorage.getItem(storageKey);
      if (savedOptions) {
        const parsed = JSON.parse(savedOptions);
        const option = parsed.find((opt: any) => opt.value === status);
        if (option && option.color) {
          return option.color;
        }
      }
    } catch (e) {
      console.error('Error loading status colors:', e);
    }
  }

  // Default color mapping for common statuses (distinct from priority palette)
  const statusLower = status.toLowerCase();
  if (statusLower.includes('todo') || statusLower.includes('pending')) {
    return { bg: '#DBEAFE', text: '#1E3A8A' }; // Blue
  } else if (statusLower.includes('progress') || statusLower.includes('in progress')) {
    return { bg: '#E0E7FF', text: '#3730A3' }; // Indigo
  } else if (statusLower.includes('done') || statusLower.includes('completed')) {
    return { bg: '#CCFBF1', text: '#0F766E' }; // Teal
  }

  // Default gray
  return { bg: '#D1D5DB', text: '#374151' };
};

/**
 * Get all status options from localStorage or default
 */
export const getStatusOptions = (projectId?: string): Array<{ value: string; name: string; color: { bg: string; text: string } }> => {
  if (typeof window === 'undefined') {
    return DEFAULT_STATUS_ENTRIES.map((o, index) => ({
      ...o,
      color: DEFAULT_STATUS_ENTRIES[index % DEFAULT_STATUS_ENTRIES.length].color,
    }));
  }

  try {
    const storageKey = projectId ? `statusOptions_${projectId}` : 'statusOptions';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasPriorityPalette = parsed.some(
          (opt: any) => opt?.color?.bg && PRIORITY_BG_SET.has(String(opt.color.bg).toLowerCase())
        );
        if (hasPriorityPalette) {
          // Migrate to distinct status palette
          const migrated = parsed.map((opt: any, idx: number) => ({
            ...opt,
            color: STATUS_COLORS_EXTENDED[idx % STATUS_COLORS_EXTENDED.length],
          }));
          localStorage.setItem(storageKey, JSON.stringify(migrated));
          return migrated;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading status options:', e);
  }

  // Return default options
  return DEFAULT_STATUS_ENTRIES.map((o, index) => ({
    ...o,
    color: DEFAULT_STATUS_ENTRIES[index % DEFAULT_STATUS_ENTRIES.length].color,
  }));
};

/**
 * Get display name for a status (custom name if available, otherwise value)
 */
export const getStatusDisplayName = (status: string, projectId?: string): string => {
  if (!status) return 'Not set';
  
  const options = getStatusOptions(projectId);
  const option = options.find((opt) => opt.value === status);
  return option?.name || status;
};

/**
 * Get custom field title from localStorage
 */
export const getStatusFieldTitle = (projectId?: string): string => {
  if (typeof window === 'undefined') return 'Status';
  
  try {
    const storageKey = projectId ? `statusFieldTitle_${projectId}` : 'statusFieldTitle';
    const saved = localStorage.getItem(storageKey);
    return saved || 'Status';
  } catch (e) {
    return 'Status';
  }
};

