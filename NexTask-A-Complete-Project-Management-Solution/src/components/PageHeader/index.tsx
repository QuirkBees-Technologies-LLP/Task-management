import React from 'react';
import { CardHeader, CardHeaderPropsWithComponent } from '@mui/material';

export default function PageHeader({ ...props }: CardHeaderPropsWithComponent) {
  return (
    <CardHeader
      {...props}
      sx={{
        px: 0,
        ['& .MuiCardHeader-action']: {
          mr: 0,
        },
      }}
      titleTypographyProps={{ variant: 'h5', sx: { m: 0, fontSize: '1.5rem' } }}
    />
  );
}
