import { Box, Chip, Stack, Typography } from '@mui/material';
import { Contract, ResponsiveTableColumn } from './types';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

export const getStatusStyles = (status: string) => {
  const s = status?.toLowerCase();

  switch (s) {
    case 'completed':
      return {
        color: 'rgba(34, 197, 94, 1)',          // green
        backgroundColor: 'rgba(34, 197, 94, 0.18)',
      };

    case 'active':
      return {
        color: 'rgba(167, 139, 250, 1)',        // purple (dark-friendly)
        backgroundColor: 'rgba(167, 139, 250, 0.18)',
      };

    case 'pending':
      return {
        color: 'rgba(251, 191, 36, 1)',         // yellow
        backgroundColor: 'rgba(251, 191, 36, 0.18)',
      };

    case 'draft':
    default:
      return {
        color: '#0698E2',
        backgroundColor: 'rgba(0,152,226,0.15)',
      };
  }
};

const renderDateWithCalendar = (date?: string) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <CalendarTodayOutlinedIcon
      sx={{
        fontSize: 16,
        color: 'text.secondary',
      }}
    />
    <Typography variant="body2" color="text.secondary">
      {date || 'N/A'}
    </Typography>
  </Stack>
);

const getStatusDotColor = (status?: string) => {
  if (!status) return '#9CA3AF'; // fallback gray

  const styles = getStatusStyles(status);
  return styles.color; // SAME color as status text
};

const renderBudgetWithDot = (
  budget: string | number,
  status?: string
) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: getStatusDotColor(status),
      }}
    />
    <Typography fontSize={13} fontWeight={500}>
      ₹{budget}
    </Typography>
  </Stack>
);

const ACCENT_COLORS = [
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#F59E0B', // yellow
  '#EC4899', // pink
  '#22C55E', // green
];

const getAccentColor = (value: string) => {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % ACCENT_COLORS.length;
  return ACCENT_COLORS[index];
};


export const contractColumns: ResponsiveTableColumn[] = [
  {
    title: 'Title',
    key: 'title',
    render: ({ title }: Contract) => {
      const accentColor = getAccentColor(title);

      return (
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Dynamic colored line */}
          <Box
            sx={{
              width: 3,
              height: 28,
              borderRadius: 2,
              backgroundColor: accentColor,
            }}
          />

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
        </Stack>
      );
    },
  },
  {
    title: 'Client',
    key: 'client',
    render: ({ client }: Contract) => (
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 500,
          color: 'text.secondary',
        }}
      >
        {client}
      </Typography>
    ),
  },
  {
    title: 'Start Date',
    key: 'startDate',
    render: ({ startDate }: Contract) =>
      renderDateWithCalendar(startDate),
  },
  {
    title: 'End Date',
    key: 'endDate',
    render: ({ endDate }: Contract) =>
      renderDateWithCalendar(endDate),
  },
  {
    title: 'Status',
    key: 'status',
    align: 'left',
    render: ({ status }: Contract) => {
      const styles = getStatusStyles(status!);
      return (
        <Chip
          label={status}
          sx={{
            height: 24,
            fontWeight: 500,
            borderRadius: '4px',
            fontSize: '12px',
            minWidth: 'fit-content',
            color: styles.color,
            backgroundColor: styles.backgroundColor,
          }}
        />
      );
    },
  },
  {
    title: 'Budget',
    key: 'budget',
    render: ({ budget, status }: Contract) =>
      renderBudgetWithDot(budget, status),
  },
];
