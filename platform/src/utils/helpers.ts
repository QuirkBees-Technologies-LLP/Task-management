import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { jwtDecode } from 'jwt-decode';

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (!decoded.exp) {
      return true; // No expiration claim, consider expired
    }
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    return decoded.exp * 1000 < Date.now();
  } catch {
    // If decoding fails, consider token expired/invalid
    return true;
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
