/**
 * Status color system - single source of truth
 * Colors for status options (customizable)
 * NOTE: Intentionally different from the priority palette to avoid overlap.
 */
export const STATUS_COLORS_EXTENDED = [
  { bg: 'rgba(59,130,246,0.20)',  text: 'rgba(30,64,175,1)' },   // Blue
  { bg: 'rgba(99,102,241,0.20)',  text: 'rgba(55,48,163,1)' },  // Indigo
  { bg: 'rgba(20,184,166,0.20)',  text: 'rgba(68,175,166,1)' }, // Teal
  { bg: 'rgba(244,63,94,0.20)',   text: 'rgba(190,18,60,1)' },  // Rose
  { bg: 'rgba(168,85,247,0.20)',  text: 'rgba(126,34,206,1)' }, // Purple
  { bg: 'rgba(14,165,233,0.20)',  text: 'rgba(7,89,133,1)' },   // Sky
  { bg: 'rgba(148,163,184,0.20)', text: 'rgba(31,41,55,1)' },   // Gray
  { bg: 'rgba(236,72,153,0.20)',  text: 'rgba(157,23,77,1)' },  // Pink
  { bg: 'rgba(107,114,128,0.20)', text: 'rgba(17,24,39,1)' },   // Stone
  { bg: 'rgba(79,70,229,0.20)',   text: 'rgba(49,46,129,1)' },  // Deep Indigo
];

export type StatusValue = string;

// Default status options and their distinct (non-priority) colors
const DEFAULT_STATUS_ENTRIES = [
  {
    value: 'Todo',
    name: 'Todo',
    color: { bg: 'rgba(59,130,246,0.20)', text: 'rgba(30,64,175,1)' },
  },
  {
    value: 'In Progress',
    name: 'In Progress',
    color: { bg: 'rgba(99,102,241,0.20)', text: 'rgba(55,48,163,1)' },
  },
  {
    value: 'Done',
    name: 'Done',
    color: { bg: 'rgba(20,184,166,0.20)', text: 'rgba(68,175,166,1)' },
  },
] as const;

export const DEFAULT_STATUS_OPTIONS: StatusValue[] = DEFAULT_STATUS_ENTRIES.map((o) => o.value);

/**
 * Get status color from localStorage or default
 */
const PRIORITY_BG_SET = new Set([
  'rgba(34,197,94,0.2)',
  'rgba(251,191,36,0.2)',
  'rgba(168,85,247,0.2)',
]);

/**
 * Get status color from localStorage or default
 */
export const getStatusColor = (
  status: string,
  projectId?: string
): { bg: string; text: string } => {
  if (!status) {
    return {
      bg: 'rgba(148,163,184,0.20)',
      text: 'rgba(31,41,55,1)',
    };
  }

  if (typeof window !== 'undefined') {
    try {
      const storageKey = projectId ? `statusOptions_${projectId}` : 'statusOptions';
      const savedOptions = localStorage.getItem(storageKey);
      if (savedOptions) {
        const parsed = JSON.parse(savedOptions);
        const option = parsed.find((opt: any) => opt.value === status);
        if (option?.color) {
          return option.color;
        }
      }
    } catch (e) {
      console.error('Error loading status colors:', e);
    }
  }

  const statusLower = status.toLowerCase();

  if (statusLower.includes('todo') || statusLower.includes('pending')) {
    return { bg: 'rgba(59,130,246,0.20)', text: 'rgb(101, 128, 216, 1)' };
  }

  if (statusLower.includes('progress')) {
    return { bg: 'rgba(99,102,241,0.20)', text: 'rgba(55,48,163,1)' };
  }

  if (statusLower.includes('done') || statusLower.includes('completed')) {
    return { bg: 'rgba(20,184,166,0.20)', text: 'rgba(68,175,166,1)' };
  }

  return {
    bg: 'rgba(148,163,184,0.20)',
    text: 'rgba(31,41,55,1)',
  };
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

