'use client';

import React, { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  ButtonGroup,
  Stack,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';

const locales = {
  // 'pt-BR': require('date-fns/locale/pt-BR'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const events: Event[] = [
  {
    title: 'Project Kickoff',
    start: new Date(),
    end: new Date(),
    allDay: true,
  },
  {
    title: 'Sprint Planning',
    start: new Date(new Date().setHours(10, 0)),
    end: new Date(new Date().setHours(12, 0)),
  },
];

const Calendar = () => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1);
    else if (direction === 'next') newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setTime(Date.now());
    setCurrentDate(newDate);
  };

  return (
    <Card
      sx={{
        bgcolor: theme.palette.background.paper,
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Custom Header */}
      <CardHeader
        title={
          <Typography variant="h6" fontWeight="600">
            {view === 'month'
              ? format(currentDate, 'MMMM yyyy') // e.g., October 2025
              : view === 'week'
                ? `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}` // Week of Oct 6, 2025
                : format(currentDate, 'EEEE, MMM d, yyyy')}{' '}
            {/* e.g., Friday, Oct 10, 2025 */}
          </Typography>
        }
        action={
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => handleNavigate('prev')}>
              <NavigateBefore fontSize="small" color="secondary" />
            </IconButton>

            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={() => handleNavigate('today')}
            >
              Today
            </Button>

            <IconButton onClick={() => handleNavigate('next')}>
              <NavigateNext fontSize="small" color="secondary" />
            </IconButton>

            <ButtonGroup variant="outlined" size="small" sx={{ ml: 2 }}>
              <Button
                onClick={() => setView('month')}
                variant={view === 'month' ? 'contained' : 'outlined'}
              >
                Month
              </Button>
              <Button
                onClick={() => setView('week')}
                variant={view === 'week' ? 'contained' : 'outlined'}
              >
                Week
              </Button>
              <Button
                onClick={() => setView('day')}
                variant={view === 'day' ? 'contained' : 'outlined'}
              >
                Day
              </Button>
            </ButtonGroup>
          </Stack>
        }
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          p: 2,
        }}
      />

      {/* Calendar */}
      <CardContent sx={{ flex: 1, p: 2 }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={view}
          onView={(v) => setView(v as 'month' | 'week' | 'day')}
          onNavigate={(date) => setCurrentDate(date)}
          style={{
            height: '100%',
            borderRadius: 12,
            backgroundColor: theme.palette.background.default,
          }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
              borderRadius: '6px',
              padding: '2px 6px',
              border: 'none',
            },
          })}
          tooltipAccessor={(event) => event.title}
          components={{
            toolbar: () => null,
          }}
        />
      </CardContent>
    </Card>
  );
};

export default Calendar;
