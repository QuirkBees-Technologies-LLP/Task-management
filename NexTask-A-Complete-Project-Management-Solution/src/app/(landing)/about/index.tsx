'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Mui imports
import {
  Box,
  Typography,
  Grid2,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Stack,
  Button,
  Paper,
  CardContent,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { FollowTheSignsOutlined, PhoneOutlined, CheckCircle } from '@mui/icons-material';

// Components
import AnimatedComponent from '@/components/Animated';
import Carousel from '@/components/Carousel';
// Utils
import { appbarHeight } from '@/utils/constants';
import { gradientAnimation } from '../home/helpers';
import { hexToRgbChannel, varAlpha } from '@/theme/utils';
import { featureItems, features } from './helpers';

const About: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const images = [
    `/images/dashboard-${theme.palette.mode}.png`,
    `/images/tasks-${theme.palette.mode}.png`,
    `/images/reports-${theme.palette.mode}.png`,
    `/images/project-details-${theme.palette.mode}.png`,
  ];

  return (
    <>
      <Box
        sx={{
          height: {
            xs: '70vh',
            md: `calc(100vh - ${appbarHeight}px)`,
            lg: '75vh',
          },
        }}
      >
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
                    Let’s build the future of work, together.
                  </Typography>
                </AnimatedComponent>
                <AnimatedComponent animationType="slideRight">
                  <Typography variant={isSmallScreen ? 'caption' : 'body1'}>
                    At NexTask, we’re passionate about transforming the way teams collaborate and
                    achieve their goals. Our mission is to create intuitive, efficient, and scalable
                    tools that empower individuals and organizations to manage projects seamlessly.
                    With a focus on innovation and user-centric design, we’ve built a platform that
                    simplifies complex workflows, enhances team communication, and drives
                    productivity. Whether you’re a startup or an enterprise, NexTask is your partner
                    in delivering success—on time, every time. Join thousands of teams worldwide who
                    trust us to turn ideas into reality.
                  </Typography>
                </AnimatedComponent>
                <AnimatedComponent animationType="slideRight">
                  <Box>
                    <Link href="/signup">
                      <Button variant="contained" startIcon={<FollowTheSignsOutlined />}>
                        Create account
                      </Button>
                    </Link>
                    <Link href={'#contact-form'}>
                      <Button startIcon={<PhoneOutlined />} variant="outlined" sx={{ ml: 1 }}>
                        Contact us
                      </Button>
                    </Link>
                  </Box>
                </AnimatedComponent>
              </Stack>
            </Box>
          </Grid2>
        </Grid2>
      </Box>

      <Paper variant="elevation" elevation={15} sx={{ my: 8 }}>
        <CardContent>
          <Box my={4}>
            <Grid2 container justifyContent="center">
              <Grid2 size={{ xs: 12, sm: 10, md: 7 }}>
                <Typography variant="h5" textAlign="center" gutterBottom>
                  Enhance Team Collaboration and Productivity
                </Typography>
                <Divider>
                  <Typography textAlign="center" variant="body2">
                    Streamlined collaboration for productivity
                  </Typography>
                </Divider>
              </Grid2>
            </Grid2>
          </Box>
          <Box p={4}>
            <Grid2 container spacing={4}>
              {features.map((item, index) => (
                <Grid2 size={{ xs: 12, sm: 12, md: 4 }} key={index} justifyContent={'center'}>
                  <Stack spacing={2} alignItems="center">
                    <Paper
                      sx={{
                        ['&&&']: {
                          p: 1,
                          background: `${varAlpha(
                            hexToRgbChannel(theme.palette.primary.main),
                            0.1
                          )}`,
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                      style={{ width: 52, height: 52 }}
                    >
                      <Stack alignItems="center" justifyContent="center">
                        {item.icon}
                      </Stack>
                    </Paper>
                    <Typography variant="h6">{item.title}</Typography>
                    <Typography variant="body2" textAlign={'center'}>
                      {item.description}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 2, display: { xs: 'block', md: 'none' } }} />
                </Grid2>
              ))}
            </Grid2>
          </Box>
        </CardContent>
      </Paper>

      {featureItems.map((item, index) => {
        const isReverse = index % 2 !== 0 && !isSmallScreen;
        return (
          <Box py={6} key={index}>
            <Grid2 container alignItems={'center'} direction={!isReverse ? 'row' : 'row-reverse'}>
              <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
                <Box
                  textAlign={{
                    xs: 'initial',
                    md: isReverse ? 'right' : 'left',
                  }}
                >
                  <Typography variant="h6" color="primary">
                    {item.subtitle}
                  </Typography>
                  <Typography variant="h4" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" gutterBottom>
                    {item.description}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    float: isReverse ? 'right' : 'left',
                    direction: isReverse ? 'rtl' : 'ltr',
                  }}
                >
                  <List>
                    {item.checkListItems.map((text, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: { xs: 0, sm: 1 } }}>
                        <ListItemIcon
                          sx={{
                            minWidth: 'auto',
                            marginLeft: isReverse ? '8px' : 0,
                            marginRight: !isReverse ? '8px' : 0,
                          }}
                        >
                          <CheckCircle color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primaryTypographyProps={{
                            sx: {
                              fontSize: { xs: 13, sm: 15, md: 17 },
                            },
                          }}
                        >
                          {text}
                        </ListItemText>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
                <Box
                  textAlign={{
                    xs: 'center',
                    md: !isReverse ? 'right' : 'left',
                  }}
                  width={{ xs: '100%', sm: '75%', md: '100%' }}
                  mx={'auto'}
                >
                  <Image
                    src={item.img}
                    alt={item.title}
                    height={400}
                    width={400}
                    style={{ width: '70%', height: '70%' }}
                  />
                </Box>
                <Divider sx={{ my: 2, display: { xs: 'block', md: 'none' } }} />
              </Grid2>
            </Grid2>
          </Box>
        );
      })}

      <Box py={6}>
        <Box my={4}>
          <Grid2 container justifyContent="center">
            <Grid2 size={{ xs: 12, sm: 10, md: 7 }}>
              <Typography variant="h5" textAlign="center" gutterBottom>
                System Overview
              </Typography>
              <Divider>
                <Typography textAlign="center" variant="body2">
                  Discover Our System
                </Typography>
              </Divider>
            </Grid2>
          </Grid2>
        </Box>
        <Carousel images={images} />
      </Box>
    </>
  );
};

export default About;
