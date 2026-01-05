'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography, useTheme } from '@mui/material';
import { ApexOptions } from 'apexcharts';

// Dynamically import the Chart component to ensure it only loads on the client-side
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface BasicBarChartProps {
  height?: number | string;
  title?: string;
}

const BasicBarChart: React.FC<BasicBarChartProps> = ({ height = 350, title }) => {
  const theme = useTheme();

  // Chart series data - exactly as specified
  const series = useMemo(
    () => [
      {
        name: 'series-1',
        data: [30, 40, 45, 50, 49, 60, 70, 91],
      },
    ],
    []
  );

  // Chart configuration options
  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'bar',
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily,
          },
        },
      },
      yaxis: {
        title: {
          text: 'Values',
          style: {
            color: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily,
          },
        },
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily,
          },
        },
      },
      fill: {
        opacity: 1,
        colors: [theme.palette.primary.main],
      },
      colors: [theme.palette.primary.main],
      tooltip: {
        theme: theme.palette.mode,
        y: {
          formatter: function (val: number) {
            return val.toString();
          },
        },
      },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 3,
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            plotOptions: {
              bar: {
                columnWidth: '65%',
              },
            },
          },
        },
      ],
    }),
    [theme, height]
  );

  const chartHeight = typeof height === 'number' ? height : 350;

  return (
    <>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
          {title}
        </Typography>
      )}
      <Box sx={{ width: '100%' }}>
        <Chart options={options} series={series} type="bar" height={chartHeight} width="100%" />
      </Box>
    </>
  );
};

export default BasicBarChart;

