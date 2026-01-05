'use client';
import { SnackbarProvider } from 'notistack';
import { defaultAnchorOrigin } from '@/utils/constants';
import CustomTheme from '@/theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import '@/styles/globals.css';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { Provider } from 'react-redux';
import { makeStore } from '@/redux/store';
import { useEffect } from 'react';
import { setGlobalRouter } from '@/utils/helpers';
import { useRouter } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const store = makeStore();

  useEffect(() => {
    setGlobalRouter(router);
  }, [router]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: false }}>
          <Provider store={store}>
            <CustomTheme>
              <InitColorSchemeScript attribute="class" />
              <SnackbarProvider
                maxSnack={3}
                autoHideDuration={6000}
                anchorOrigin={defaultAnchorOrigin}
              >
                {children}
              </SnackbarProvider>
            </CustomTheme>
          </Provider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
