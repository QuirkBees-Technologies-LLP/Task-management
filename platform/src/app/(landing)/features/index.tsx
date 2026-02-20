'use client';
import React from 'react';
import AnimatedComponent from '@/components/Animated';
import {
  Box,
  CardContent,
  Grid2,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { gradientAnimation } from '../home/helpers';
import Image from 'next/image';
import { appFeatures } from './helpers';

export default function Features() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <div>
      <Box pb={8}>
        <Grid2 container justifyContent="center">
          <Grid2 size={{ xs: 12, sm: 12, md: 9 }}>
            <Box sx={{ mt: { xs: 2, md: 4 } }} textAlign="center">
              <Stack spacing={4}>
                <AnimatedComponent animationType="slideLeft">
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '8vw', md: '4.5rem' },
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.light})`,
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: `${gradientAnimation} 4s ease infinite`,
                      lineHeight: 1.3,
                    }}
                  >
                    App Features
                  </Typography>
                </AnimatedComponent>
              </Stack>
            </Box>
          </Grid2>
        </Grid2>
      </Box>
      <Box>
        <Paper>
          <CardContent>
            <Grid2 container>
              {appFeatures.map((item, index) => (
                <Grid2 size={{ xs: 12, sm: 4, md: 3 }} key={index}>
                  <Stack alignItems={'center'}>
                    <Box textAlign={'center'}>
                      <Image
                        src={`/images/${item.img}`}
                        alt="analytics"
                        height={isSmallScreen ? 200 : 400}
                        width={isSmallScreen ? 200 : 400}
                        style={{ height: '100%', width: '100%' }}
                      />
                    </Box>
                    <Box textAlign={'center'}>
                      <Typography variant="h4">{item.title}</Typography>
                      <Typography
                        variant="caption"
                        component={'span'}
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      ></Typography>
                    </Box>
                  </Stack>
                </Grid2>
              ))}
            </Grid2>
          </CardContent>
        </Paper>
      </Box>
    </div>
  );
}
