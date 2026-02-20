'use client';

import React from 'react';
import Link from 'next/link';
import { appbarHeight } from '@/utils/constants';
import { FollowTheSignsOutlined, PhoneOutlined } from '@mui/icons-material';
import {
  Box,
  Stack,
  Typography,
  Button,
  Paper,
  CardContent,
  useTheme,
  Divider,
  Grid2,
  useMediaQuery,
} from '@mui/material';
import { cardItems, companies, gradientAnimation } from './helpers';
import { hexToRgbChannel, varAlpha } from '@/theme/utils';
import Marquee from 'react-fast-marquee';
import Image from 'next/image';
import KeyFeatures from './components/Features';
import FAQs from './components/FAQs';
import ContactForm from './components/ContactForm';
import AnimatedComponent from '@/components/Animated';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          height: {
            xs: '65vh',
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
                      background: `linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)`,
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: `${gradientAnimation} 4s ease infinite`,
                      lineHeight: 1.3,
                    }}
                  >
                    Project Management
                  </Typography>
                  <Typography
                    variant="h1"
                    sx={{
                      ['&&&']: {
                        fontSize: { xs: '8vw', md: '4.5rem' },
                        background: 'transparent',
                        marginTop: 0,
                      },
                    }}
                  >
                    Solution for Seamless Efficiency
                  </Typography>
                </AnimatedComponent>
                <AnimatedComponent animationType="slideRight">
                  <Typography variant="body2">
                    Unleash peak productivity with our cloud-based project management platform.
                    Streamline workflows, boost team collaboration, and stay ahead of deadlines.
                    Effortlessly create tasks, assign them to team members, and track progress in
                    real-time.
                  </Typography>
                </AnimatedComponent>
                <AnimatedComponent animationType="slideRight">
                  <Box>
                    <Link href="/signup">
                      <Button variant="contained" sx={{
                        background:"linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)" , borderRadius: '5px !important' , py: '10px', 
                      }} startIcon={<FollowTheSignsOutlined />}>
                        Create account
                      </Button>
                    </Link>
                    <Link href={'#contact-form'}>
                      <Button startIcon={<PhoneOutlined />} variant="outlined" sx={{ ml: 1  , borderRadius: '5px !important' , py: '10px', }}>
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

      {/* Trusted Companies Section */}
      <Box component="section" py={8}>
        <Grid2 container justifyContent="center">
          <Grid2 size={{ xs: 11, sm: 10, md: 7 }}>
            <Typography variant="h5" textAlign="center" gutterBottom>
              Never lose track of your projects again—stay organized, on schedule, and always in
              control.
            </Typography>
            <Divider>
              <Typography textAlign="center" variant="body2">
                Trusted by 100+ amazing companies
              </Typography>
            </Divider>
          </Grid2>
          <Grid2 size={12}>
            <Marquee gradient gradientColor={theme.palette.background.default}>
              {companies.map((company, index) => (
                <Box key={index} m={isSmallScreen ? 3 : 6}>
                  <Image
                    src={company.logo}
                    alt={company.name}
                    blurDataURL={company.logo}
                    height={isSmallScreen ? 30 : 100}
                    width={isSmallScreen ? 60 : 200}
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              ))}
            </Marquee>
          </Grid2>
        </Grid2>
      </Box>

      {/* Challenges and Solutions Section */}
      <Box component="section" py={8}>
        <Grid2
          container
          justifyContent={isSmallScreen ? 'center' : 'space-between'}
          alignItems="center"
        >
          <Grid2 size={{ xs: 11, sm: 10, md: 4 }}>
            <AnimatedComponent animationType="slideLeft">
              <Typography
                variant={isSmallScreen ? 'h5' : 'h3'}
                textAlign={isSmallScreen ? 'center' : 'left'}
              >
                Managing projects & tasks efficiently is challenging.
              </Typography>
            </AnimatedComponent>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
            <Grid2 container>
              {cardItems.map((item, index) => (
                <Grid2 key={index + 1} size={12}>
                  <AnimatedComponent animationType="slideRight" delay={Number(`0.${index}`)}>
                    <Paper>
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
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
                          <Box>
                            <Typography variant="body2">{item.description}</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Paper>
                  </AnimatedComponent>
                </Grid2>
              ))}
            </Grid2>
          </Grid2>
        </Grid2>
      </Box>

      {/* Key Features Section */}
      <KeyFeatures />

      {/* FAQs Section */}
      <FAQs />

      {/* Contact Section */}
      <ContactForm />
    </>
  );
};

export default HomePage;
