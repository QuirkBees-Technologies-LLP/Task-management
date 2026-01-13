import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { grey } from '@mui/material/colors';
import { renderToString } from 'react-dom/server';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type DataPoint = {
  x: number;
  y: number;
};

const ApexChart = () => {
  const theme = useTheme();
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) return;

        const response = await axios.get('/api/clients?limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data?.success) return;

        const clients: any[] = response.data.clients || [];

        // Bucket clients by month/year of creation
        const buckets = new Map<string, number>();

        clients.forEach((client) => {
          const createdAt = client.createdAt ? new Date(client.createdAt) : null;
          if (!createdAt || isNaN(createdAt.getTime())) return;

          const year = createdAt.getFullYear();
          const month = createdAt.getMonth(); // 0-based
          const key = `${year}-${month}`;

          buckets.set(key, (buckets.get(key) || 0) + 1);
        });

        const points: DataPoint[] = Array.from(buckets.entries())
          .map(([key, count]) => {
            const [yearStr, monthStr] = key.split('-');
            const year = Number(yearStr);
            const month = Number(monthStr);

            return {
              x: new Date(year, month, 1).getTime(),
              y: count,
            };
          })
          .sort((a, b) => a.x - b.x);

        setDataPoints(points);
      } catch (error) {
        console.error('Error fetching customer chart data:', error);
      }
    };

    fetchClientData();
  }, []);

  const series: ApexOptions['series'] = useMemo(
    () => [
      {
        data: dataPoints.length
          ? dataPoints
          : [
              // Single zero point so empty orgs don't show fake data
              { x: new Date().getTime(), y: 0 },
            ],
      },
    ],
    [dataPoints]
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
          formatter: (val) => `${Math.round(val)}`,
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
    <Box height={300}>
      <Chart options={options} series={series} type="area" height="100%" />
    </Box>
  );
};

export default ApexChart;
