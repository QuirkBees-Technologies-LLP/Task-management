import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/app/api/config';

export function isTokenExpired(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return false;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return true;
    }
    return false;
  }
}

export function handleErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    enqueueSnackbar({
      message: error.response?.data?.error || error.message || 'An unexpected error occurred',
      variant: 'error',
    });
  } else {
    enqueueSnackbar({ message: 'An unknown error occurred', variant: 'error' });
  }
}

export const safeLocalStorageSet = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

export const safeLocalStorageGet = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

let globalRouter: any;
export const setGlobalRouter = (router: any) => {
  globalRouter = router;
};
export const navigateTo = (path: string) => {
  if (globalRouter) {
    globalRouter.push(path);
  } else {
    console.error('Router is not initialized');
  }
};
