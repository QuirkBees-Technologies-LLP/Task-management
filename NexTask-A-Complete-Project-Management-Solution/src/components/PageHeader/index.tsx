import React from 'react';
import { Box, CardHeader, CardHeaderPropsWithComponent } from '@mui/material';
import { usePathname } from 'next/navigation';

export default function PageHeader({ ...props }: CardHeaderPropsWithComponent) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  // In dashboard pages, the title + breadcrumbs are shown in the app header.
  // Avoid duplicating them inside the page content. Keep actions (buttons) if provided.
  if (isDashboard) {
    if (props.action) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          {props.action}
        </Box>
      );
    }
    return null;
  }

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
