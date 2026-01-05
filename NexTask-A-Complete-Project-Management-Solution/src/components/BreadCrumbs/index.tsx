'use client';
import React, { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Breadcrumbs, Typography, Link, capitalize } from '@mui/material';
import { usePathname } from 'next/navigation';

interface Breadcrumb {
  label: string;
  href: string;
}

const DynamicBreadcrumbs = ({ inDashboard = true }) => {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  const generateBreadcrumbs = useCallback(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbPaths: Breadcrumb[] = pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      return {
        label: segment
          .replace(/-/g, ' ')
          .split(' ')
          .map((word) => capitalize(word))
          .join(' '), // Join back into a single string
        href,
      };
    });

    if (breadcrumbPaths.length > 0 && breadcrumbPaths[0].href !== '/dashboard' && inDashboard) {
      breadcrumbPaths.unshift({
        label: 'Dashboard',
        href: '/dashboard',
      });
    }

    setBreadcrumbs(breadcrumbPaths);
  }, [pathname]);

  useEffect(() => {
    generateBreadcrumbs();
  }, [pathname, generateBreadcrumbs]);

  return breadcrumbs.length > 1 ? (
    <Breadcrumbs aria-label="breadcrumbs" sx={{ '&& > *': { fontSize: 14 }, mb: 2 }}>
      {breadcrumbs[0] && (
        <Link component={NextLink} href={breadcrumbs[0].href} key="home" color="inherit">
          {breadcrumbs[0].label}
        </Link>
      )}
      {breadcrumbs.slice(1).map((breadcrumb, index) => (
        <span key={index}>
          {index === breadcrumbs.length - 2 ? (
            <Typography fontWeight={700}>{breadcrumb.label}</Typography>
          ) : (
            <Link component={NextLink} key={breadcrumb.href} href={breadcrumb.href} color="inherit">
              {breadcrumb.label}
            </Link>
          )}
        </span>
      ))}
    </Breadcrumbs>
  ) : null;
};

export default DynamicBreadcrumbs;
