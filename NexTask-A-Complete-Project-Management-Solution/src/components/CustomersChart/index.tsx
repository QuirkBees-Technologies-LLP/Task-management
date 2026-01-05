import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { grey } from '@mui/material/colors';
import { renderToString } from 'react-dom/server';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const ApexChart = () => {
  const theme = useTheme();
  const dates = useMemo(
    () => [
      { x: new Date('2023-01-01').getTime(), y: 1000000 },
      { x: new Date('2023-02-01').getTime(), y: 1500000 },
      { x: new Date('2023-03-01').getTime(), y: 1250000 },
      { x: new Date('2023-04-01').getTime(), y: 2000000 },
    ],
    []
  );

  const series: ApexOptions['series'] = useMemo(
    () => [
      {
        data: dates,
      },
    ],
    [dates]
  );

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'area',
        stacked: false,
        height: 350,
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 0,
      },
      colors: [theme.palette.primary.main, theme.palette.secondary.main],
      yaxis: {
        labels: {
          formatter: (val) => `${(val / 1000).toFixed(0)}k`,
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
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
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
        yaxis: {
          lines: {
            show: true,
          },
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      tooltip: {
        shared: false,
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
                Customers: {value}
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
        <Chart options={options} series={series} type="area" height="100%" />
      </Box>
    </>
  );
};

export default ApexChart;
