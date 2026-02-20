import React, { useContext, useState } from 'react';
import Image from 'next/image';
import { Box, IconButton, Paper, Stack } from '@mui/material';
import { Circle } from '@mui/icons-material';
import { CarouselProvider, Slider, Slide, DotGroup, CarouselContext } from 'pure-react-carousel';
import 'pure-react-carousel/dist/react-carousel.es.css';

interface DotsProps {
  slides: number;
  activeIndex: number;
  onClick: (index: number) => void;
}

const Dots: React.FC<DotsProps> = ({ slides, activeIndex, onClick }) => {
  return (
    <Stack direction={'row'} justifyContent={'center'} sx={{ mt: 2 }}>
      {Array.from({ length: slides }).map((_, index) => (
        <IconButton
          key={index}
          onClick={() => onClick(index)}
          color={activeIndex === index ? 'primary' : 'default'}
          sx={{ p: 0, m: 0.2 }}
        >
          <Circle sx={{ fontSize: 10 }} />
        </IconButton>
      ))}
    </Stack>
  );
};

interface CarouselProps {
  images: string[];
}

const ImagesCarousel: React.FC<CarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <CarouselProvider
      naturalSlideWidth={100}
      naturalSlideHeight={125}
      totalSlides={images.length}
      isIntrinsicHeight={true}
      interval={3000}
      isPlaying
      currentSlide={currentIndex}
    >
      <CarouselSlider setCurrentSlide={setCurrentIndex} slides={images} />
    </CarouselProvider>
  );
};

const CarouselSlider = ({ setCurrentSlide, slides }) => {
  const context = useContext(CarouselContext);
  return (
    <>
      <Box
        sx={{
          maxWidth: { xs: '100%', md: '80%' },
          margin: 'auto',
          ['&& .carousel']: {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        <Paper sx={{ p: 0.5, m: 1 }}>
          <Slider>
            {slides.map((slide, index) => (
              <Slide index={index} key={index}>
                <Image
                  src={slide}
                  alt={slide}
                  width={2000}
                  height={475}
                  style={{ width: '100%', height: '100%' }}
                />
              </Slide>
            ))}
          </Slider>
        </Paper>
      </Box>
      <DotGroup
        renderDots={(props) => {
          return (
            <Dots
              slides={props.totalSlides || 0}
              activeIndex={props.currentSlide || 0}
              onClick={(idx) => {
                setCurrentSlide(idx);
                context.setStoreState({ currentSlide: idx });
              }}
            />
          );
        }}
      />
    </>
  );
};

export default ImagesCarousel;
