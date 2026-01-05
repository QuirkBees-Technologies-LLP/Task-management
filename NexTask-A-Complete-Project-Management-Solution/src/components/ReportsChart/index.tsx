'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Stack, useTheme } from '@mui/material';
import { ApexOptions } from 'apexcharts';
import { blue, green, orange } from '@mui/material/colors';
import { ReportsChartProps } from '@/app/dashboard/reports/types';

// Dynamically import the Chart component
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const ReportsChart: React.FC<ReportsChartProps> = ({ data }) => {
  // Aggregate data by status
  const dataSource = useMemo(() => {
    return data.reduce<Record<string, number>>((acc, item) => {
      const status = item.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [data]);

  // Get theme settings
  const theme = useTheme();

  // Prepare chart data and options
  const chartData = useMemo(() => {
    const series = Object.values(dataSource); // Status counts
    const labels = Object.keys(dataSource); // Status labels

    const options: ApexOptions = {
      chart: {
        type: 'donut',
      },
      labels,
      colors: [blue[500], orange[300], green[400]], // Custom colors
      legend: {
        position: 'bottom',
        fontFamily: theme.typography.fontFamily,
        labels: {
          colors: theme.palette.text.secondary,
        },
        markers: {
          strokeWidth: 0,
          offsetX: -5,
        },
      },
      stroke: {
        width: 0, // Disable chart stroke
      },
      dataLabels: {
        enabled: false, // Disable data labels
      },
      plotOptions: {
        pie: {
          donut: {
            size: '80%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: () => series.reduce((a, b) => a + b, 0).toString(),
                fontSize: `${theme.typography.fontSize}px`,
                color: theme.palette.text.secondary,
                fontFamily: theme.typography.fontFamily,
              },
              value: {
                fontSize: '28px',
                color: theme.palette.text.primary,
                fontWeight: 'bold',
                fontFamily: theme.typography.fontFamily,
              },
            },
          },
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    };

    return { series, options };
  }, [dataSource, theme]);

  return (
    <Stack alignItems="center" justifyContent="center">
      <Chart options={chartData.options} series={chartData.series} type="donut" width="300" />
    </Stack>
  );
};

export default ReportsChart;
