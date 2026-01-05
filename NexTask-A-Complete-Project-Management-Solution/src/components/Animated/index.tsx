import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface AnimatedComponentProps {
  children: React.ReactNode;
  animationType?: 'fadeIn' | 'slideUp' | 'slideRight' | 'slideLeft' | 'scaleIn';
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  threshold?: number;
}

const AnimatedComponent: React.FC<AnimatedComponentProps> = ({
  children,
  animationType = 'fadeIn',
  delay = 0,
  duration = 0.8,
  style,
  threshold = 0.2, // Trigger when 20% of the component is visible
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold, // Define how much of the component should be visible to trigger
      }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold]);

  const animations = {
    fadeIn: { opacity: 1, y: 0 },
    slideUp: { opacity: 1, y: 0 },
    slideRight: { opacity: 1, x: 0 },
    slideLeft: { opacity: 1, x: 0 },
    scaleIn: { scale: 1 },
  };

  const initialStates = {
    fadeIn: { opacity: 0, y: 20 },
    slideUp: { opacity: 0, y: 50 },
    slideRight: { opacity: 0, x: 100 },
    slideLeft: { opacity: 0, x: -100 },
    scaleIn: { scale: 0.8 },
  };

  return (
    <Box sx={{ overflow: 'hidden', width: '100%' }}>
      <motion.div
        ref={ref}
        initial={initialStates[animationType]}
        animate={isVisible ? animations[animationType] : initialStates[animationType]}
        transition={{
          duration,
          delay,
          ease: 'easeOut',
        }}
        style={{ ...style }}
      >
        {children}
      </motion.div>
    </Box>
  );
};

export default AnimatedComponent;
