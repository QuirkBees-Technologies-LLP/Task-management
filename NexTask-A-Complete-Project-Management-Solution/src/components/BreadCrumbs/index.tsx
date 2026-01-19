'use client';
import React, { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Breadcrumbs, Typography, Link, capitalize } from '@mui/material';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';

interface Breadcrumb {
  label: string;
  href: string;
}

const DynamicBreadcrumbs = ({ inDashboard = true }) => {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);

  // Check if we're on a project tasks page and fetch project name
  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    // Check if path is /projects/[id]/tasks
    if (pathSegments.length >= 3 && pathSegments[0] === 'projects' && pathSegments[2] === 'tasks') {
      const projectId = pathSegments[1];
      // Check if it looks like a MongoDB ObjectId (24 hex characters)
      if (projectId && /^[a-f0-9]{24}$/i.test(projectId)) {
        const fetchProjectName = async () => {
          try {
            const token = safeLocalStorageGet(accessTokenKey);
            if (!token) return;

            const response = await axios.get(`/api/projects/${projectId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success && response.data.project) {
              setProjectName(response.data.project.name || projectId);
            } else {
              setProjectName(projectId);
            }
          } catch (error) {
            console.error('Error fetching project name for breadcrumbs:', error);
            setProjectName(projectId);
          }
        };

        fetchProjectName();
      } else {
        setProjectName(null);
      }
    } else {
      setProjectName(null);
    }
  }, [pathname]);

  const generateBreadcrumbs = useCallback(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbPaths: Breadcrumb[] = pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      
      // Replace project ID with project name if available
      let label = segment;
      if (
        pathSegments.length >= 3 &&
        pathSegments[0] === 'projects' &&
        pathSegments[2] === 'tasks' &&
        index === 1 &&
        projectName &&
        /^[a-f0-9]{24}$/i.test(segment)
      ) {
        label = projectName;
      } else {
        label = segment
          .replace(/-/g, ' ')
          .split(' ')
          .map((word) => capitalize(word))
          .join(' ');
      }

      return {
        label,
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
  }, [pathname, projectName, inDashboard]);

  useEffect(() => {
    generateBreadcrumbs();
  }, [pathname, projectName, generateBreadcrumbs]);

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
