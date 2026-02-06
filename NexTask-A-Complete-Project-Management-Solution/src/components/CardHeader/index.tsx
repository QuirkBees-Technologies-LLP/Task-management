import React from 'react';
import { CardHeaderPropsWithComponent, CardHeader as MuiCardHeader } from '@mui/material';

export default function CardHeader(props: CardHeaderPropsWithComponent) {
  return (
    <MuiCardHeader
      {...props}
      titleTypographyProps={{ variant: 'h5', fontSize: 18, mt: 0 }}
      sx={{ p: '16px 24px' }}
    />
  );
}
