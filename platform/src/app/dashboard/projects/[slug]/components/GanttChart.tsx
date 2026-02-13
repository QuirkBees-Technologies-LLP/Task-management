import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { renderToString } from 'react-dom/server';
import { projectDetailTasks } from '@/utils/data';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { grey } from '@mui/material/colors';
import { ApexOptions } from 'apexcharts';

// Dynamically import the Chart component to ensure it only loads on the client-side
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Interface for the props to ensure proper type-checking
interface GanttChartProps {
  handleEditOpen: (task: (typeof projectDetailTasks)[0] | null) => void;
}

let lastClickTime = 0; // To track the timing of clicks

const GanttChart: React.FC<GanttChartProps> = ({ handleEditOpen }) => {
  const theme = useTheme();

  // Prepare tasks data for the chart using useMemo for memoization
  const tasks = useMemo(
    () =>
      projectDetailTasks.slice(0, 8).map((item) => ({
        x: `Task ${item.id}`,
        y: [new Date(item.startDate).getTime(), new Date(item.endDate).getTime()],
      })),
    []
  );

  // Chart series data
  const series: ApexOptions['series'] = useMemo(
    () => [
      {
        data: tasks,
      },
    ],
    [tasks]
  );

  // Chart configuration options
  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'rangeBar',
        height: 350,
        zoom: { enabled: false },
        toolbar: { show: false },
        events: {
          click: function (_, __, config) {
            const currentTime = new Date().getTime();
            if (currentTime - lastClickTime < 300) {
              const { dataPointIndex, seriesIndex } = config;

              if (dataPointIndex !== -1) {
                const clickedBarLabel = config.config.series[seriesIndex].data[dataPointIndex].x;
                const taskId = Number(clickedBarLabel.split(' ')[1]);
                const task = projectDetailTasks.find((item) => item.id === taskId);
                handleEditOpen(task || null); // Pass task data to handler
              }
            }
            lastClickTime = currentTime;
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: 30,
          rangeBarGroupRows: true,
          borderRadius: theme.shape.borderRadius,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val, opts) => {
          const taskId = Number(opts.w.globals.labels[opts.dataPointIndex].split(' ')[1]);
          const task = projectDetailTasks.find((item) => item.id === taskId);
          return task?.title || '';
        },
        style: {
          colors: [theme.palette.common.white],
          fontFamily: theme.typography.fontFamily,
          fontSize: '12px',
        },
        offsetX: 0,
        offsetY: 0,
      },
      colors: [theme.palette.primary.main, theme.palette.secondary.main],
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            fontFamily: theme.typography.fontFamily,
            colors: theme.palette.text.primary,
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: {
            fontFamily: theme.typography.fontFamily,
            colors: theme.palette.text.primary,
          },
        },
      },
      grid: {
        show: true,
        strokeDashArray: 5,
        position: 'back',
        borderColor: theme.palette.mode === 'dark' ? grey[700] : grey[400],
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      tooltip: {
        enabled: true,
        custom: function ({ dataPointIndex, w }) {
          const task = projectDetailTasks.find(
            (item) => item.id === Number(w.globals.labels[dataPointIndex].split(' ')[1])
          );
          const startDate = new Date(task?.startDate || new Date()).toDateString();
          const endDate = new Date(task?.endDate || new Date()).toDateString();

          return renderToString(
            <Paper
              style={{
                padding: 10,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Typography style={{ color: theme.typography.h5.color }}>
                <b>{task?.title}</b>
              </Typography>
              <Typography style={{ color: theme.typography.caption.color }}>
                <b>Start:</b> {startDate}
              </Typography>
              <Typography style={{ color: theme.typography.caption.color }}>
                <b>End:</b> {endDate}
              </Typography>
            </Paper>
          );
        },
      },
    }),
    [theme, tasks, handleEditOpen] // Added tasks as a dependency for dynamic task changes
  );

  return (
    <Box height={400}>
      <Chart options={options} series={series} type="rangeBar" height="100%" />
    </Box>
  );
};

export default GanttChart;
