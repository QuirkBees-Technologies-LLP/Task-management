import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  ImageListItem,
  Grid2,
  Button,
  StepContent,
  useMediaQuery,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { FollowTheSignsOutlined, PhoneOutlined } from '@mui/icons-material';

// Define types for steps
interface StepType {
  label: string;
  imgUrl: string;
}

const KeyFeatures: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const mode = theme.palette.mode;
  const [activeStep, setActiveStep] = useState<number>(0);
  const sections = useRef<(HTMLElement | null)[]>([]);

  // Handle the intersection of sections with the viewport
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = Number(entry.target.getAttribute('data-index'));
        setActiveStep(index);
      }
    });
  }, []);

  // Set up the Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    });

    sections.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, [handleIntersection]);

  // Define the steps for the Stepper
  const steps: StepType[] = useMemo(
    () => [
      { label: 'Dashboard Analytics', imgUrl: `dashboard-${mode}.png` },
      { label: 'Kanban Board', imgUrl: `tasks-${mode}.png` },
      { label: 'Project Details', imgUrl: `project-details-${mode}.png` },
      { label: 'Project/Task Reports', imgUrl: `reports-${mode}.png` },
    ],
    [mode]
  );

  return (
    <>
      <Box component="section" py={8} position="relative">
        <Grid2 container justifyContent="center">
          <Grid2 size={{ xs: 11, sm: 10, md: 7 }}>
            <Typography variant="h5" textAlign="center" gutterBottom>
              Core Capabilities to Enhance Your Project & Task Management
            </Typography>
            <Divider>
              <Typography textAlign="center" variant="body2">
                OpsDeck Key Features
              </Typography>
            </Divider>
          </Grid2>
        </Grid2>

        <Box pt={12}>
          <Grid2 container>
            <Grid2 size={{ xs: 12, sm: 12, md: 4 }}>
              <Box
                sx={{
                  position: { xs: 'initial', md: 'sticky' },
                  top: '35%',
                  transform: 'translate(0)',
                }}
              >
                <Stepper nonLinear activeStep={activeStep} orientation="vertical">
                  {steps.map((step) => (
                    <Step
                      key={step.label}
                      expanded={isSmallScreen || undefined}
                      active={isSmallScreen || undefined}
                    >
                      <StepLabel
                        StepIconProps={{ sx: { fontSize: 30 } }}
                        slotProps={{
                          label: {
                            sx: {
                              fontSize: {
                                xs: 15,
                                sm: 16,
                                md: 17,
                                color: 'inherit',
                              },
                            },
                          },
                        }}
                      >
                        {step.label}
                      </StepLabel>
                      <StepContent
                        TransitionProps={{ unmountOnExit: false }}
                        sx={{ display: { xs: 'block', md: 'none' } }}
                      >
                        <Paper sx={{ p: 0.5 }}>
                          <ImageListItem
                            component={Image}
                            src={`/images/${step.imgUrl}`}
                            width={0}
                            height={0}
                            sizes="100vw"
                            sx={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: `${theme.shape.borderRadius}px`,
                            }}
                            alt={step.label}
                          />
                        </Paper>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 8 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              {steps.map((step, index) => (
                <Box
                  mb={8}
                  key={`section-${index}`}
                  data-index={index}
                  ref={(el: HTMLElement | any) => (sections.current[index] = el)}
                >
                  <Paper sx={{ p: 0.5 }}>
                    <ImageListItem
                      component={Image}
                      src={`/images/${step.imgUrl}`}
                      width={0}
                      height={0}
                      sizes="100vw"
                      sx={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: `${theme.shape.borderRadius}px`,
                      }}
                      alt={step.label}
                    />
                  </Paper>
                </Box>
              ))}
            </Grid2>
          </Grid2>
        </Box>
        <Box textAlign={'center'} pt={4}>
          <Link href="/signup">
            <Button variant="contained" sx={{ background:"linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)" , borderRadius: '5px !important' , py: '10px', }} startIcon={<FollowTheSignsOutlined />}>
              Create account
            </Button>
          </Link>
          <Link href="#contact-form">
            <Button startIcon={<PhoneOutlined />} sx={{ml: 1, borderRadius: '5px !important' , py: '10px', }} variant="outlined">
              Contact us
            </Button>
          </Link>
        </Box>
      </Box>
    </>
  );
};

export default KeyFeatures;
