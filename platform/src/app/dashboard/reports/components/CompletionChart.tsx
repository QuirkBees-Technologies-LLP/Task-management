import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { grey } from '@mui/material/colors';
import { renderToString } from 'react-dom/server';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const CompletionChart = ({ data }) => {
  const theme = useTheme();

  const dates = useMemo(() => {
    // Create a data source for the chart
    const projectCompletionData = data.reduce((acc, item) => {
      // Extract the year and month from the endDate
      const endDate = new Date(item.endDate || item.dueDate);
      const yearMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(
        2,
        '0'
      )}`; // Format as "YYYY-MM"

      // Count projects ending in the same month
      acc[yearMonth] = (acc[yearMonth] || 0) + 1;
      return acc;
    }, {});

    // Convert to array in the desired format
    const chartData = Object.entries(projectCompletionData).map(([date, count]) => ({
      x: date, // Month in "YYYY-MM" format
      y: count, // Number of projects ending in that month
    }));

    return chartData;
  }, [data]);

  const series: ApexOptions['series'] = useMemo(
    () => [
      {
        name: 'Tasks Completed',
        data: dates.map((d) => ({ x: d.x, y: d.y })),
      },
    ],
    [dates]
  );

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'bar', // Changed to "bar"
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false, // Vertical bars
          columnWidth: '50%', // Adjust bar width
          borderRadius: 5, // Rounded corners
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: [theme.palette.primary.main],
      yaxis: {
        labels: {
          style: {
            fontFamily: theme.typography.fontFamily,
            colors: theme.palette.text.primary,
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          format: 'MMM yy',
          style: {
            fontFamily: theme.typography.fontFamily,
            colors: theme.typography.body1.color,
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      grid: {
        show: true,
        strokeDashArray: 5,
        borderColor: theme.palette.mode === 'dark' ? grey[700] : grey[400],
      },
      tooltip: {
        enabled: true,
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const category = w.globals.labels[dataPointIndex];
          return renderToString(
            <Paper
              style={{
                padding: 10,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <span style={{ color: theme.typography.h5.color }}>
                <b>{new Date(category).toDateString()}</b>
              </span>
              <br />
              <Typography style={{ color: theme.typography.caption.color }}>
                Tasks: {value}
              </Typography>
            </Paper>
          );
        },
      },
    }),
    [theme]
  );

  return (
    <>
      <Box height={300}>
        <Chart options={options} series={series} type="bar" height="100%" />
      </Box>
    </>
  );
};

export default CompletionChart;
