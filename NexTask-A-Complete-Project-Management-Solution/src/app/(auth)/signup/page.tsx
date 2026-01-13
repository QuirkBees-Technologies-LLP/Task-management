'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect signup to login - public signup is disabled
const Signup = () => {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  
  return null;
};
export default Signup;
