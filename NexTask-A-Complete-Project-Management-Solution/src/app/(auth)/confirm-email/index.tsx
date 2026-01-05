'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { verifyEmail } from '@/redux/slices';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { selectVerifyEmail } from '@/redux/selectors';

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading: verifying } = useSelector(selectVerifyEmail);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    if (!verifying) {
      dispatch(verifyEmail({ token }));
    }
  }, [token]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 4,
      }}
    >
      {status === 'loading' && (
        <>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verifying your email...
          </Typography>
        </>
      )}
      {status === 'success' && (
        <>
          <Typography variant="h4" color="success.main" sx={{ mb: 2 }}>
            Email Verified!
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Redirecting to login...
          </Typography>
          <Button variant="contained" color="primary" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <Typography variant="h4" color="error.main" sx={{ mb: 2 }}>
            Verification Failed
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Invalid or expired token. Please try again.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => router.push('/signup')}>
            Resend Verification Email
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => router.push('/login')}
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
        </>
      )}
    </Box>
  );
}
