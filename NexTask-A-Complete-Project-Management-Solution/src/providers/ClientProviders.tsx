"use client";

import { SnackbarProvider } from 'notistack';
import { defaultAnchorOrigin } from '@/utils/constants';
import CustomTheme from '@/theme';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { useEffect } from 'react';
import { setGlobalRouter } from '@/utils/helpers';
import { useRouter } from 'next/navigation';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    setGlobalRouter(router);
  }, [router]);

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: false }}>
      <Provider store={store}>
        <CustomTheme>
          <InitColorSchemeScript attribute="class" />
          <SnackbarProvider
            maxSnack={3}
            autoHideDuration={2000}
            anchorOrigin={defaultAnchorOrigin}
          >
            {children}
          </SnackbarProvider>
        </CustomTheme>
      </Provider>
    </AppRouterCacheProvider>
  );
}
