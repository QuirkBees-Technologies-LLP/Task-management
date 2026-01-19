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
    
    // Filter out 'dashboard' from breadcrumb labels - Dashboard should NEVER appear in breadcrumbs
    // Use case-insensitive filtering to catch any variations
    const filteredSegments = pathSegments.filter(segment => 
      segment.toLowerCase() !== 'dashboard'
    );
    
    // If no segments remain after filtering, return empty breadcrumbs
    if (filteredSegments.length === 0) {
      setBreadcrumbs([]);
      return;
    }
    
    const breadcrumbPaths: Breadcrumb[] = filteredSegments.map((segment, index) => {
      // Reconstruct href - need to include /dashboard prefix for proper routing
      const hrefSegments = ['dashboard', ...filteredSegments.slice(0, index + 1)];
      const href = '/' + hrefSegments.join('/');
      
      // Replace project ID with project name if available
      let label = segment;
      if (
        filteredSegments.length >= 3 &&
        filteredSegments[0] === 'projects' &&
        filteredSegments[2] === 'tasks' &&
        index === 1 &&
        projectName &&
        /^[a-f0-9]{24}$/i.test(segment)
      ) {
        label = projectName;
      } else {
        // Capitalize the label, but ensure 'dashboard' never appears even if capitalized
        label = segment
          .replace(/-/g, ' ')
          .split(' ')
          .map((word) => {
            // Double-check: never allow 'dashboard' or 'Dashboard' as a label
            const lowerWord = word.toLowerCase();
            if (lowerWord === 'dashboard') {
              return ''; // Skip dashboard entirely
            }
            return capitalize(word);
          })
          .filter(word => word !== '') // Remove any empty strings
          .join(' ');
      }

      return {
        label,
        href,
      };
    }).filter(breadcrumb => breadcrumb.label !== '' && breadcrumb.label.toLowerCase() !== 'dashboard'); // Final safety check

    // Commented out - Dashboard should NEVER appear in breadcrumbs
    // if (breadcrumbPaths.length > 0 && breadcrumbPaths[0].href !== '/dashboard' && inDashboard) {
    //   breadcrumbPaths.unshift({
    //     label: 'Dashboard',
    //     href: '/dashboard',
    //   });
    // }

    setBreadcrumbs(breadcrumbPaths);
  }, [pathname, projectName, inDashboard]);

  useEffect(() => {
    generateBreadcrumbs();
  }, [pathname, projectName, generateBreadcrumbs]);

  // Filter out any breadcrumbs that might have 'dashboard' as label (final safety check)
  const safeBreadcrumbs = breadcrumbs.filter(
    (crumb) => crumb.label.toLowerCase() !== 'dashboard' && crumb.label !== ''
  );

  // Only show breadcrumbs if there's at least one valid breadcrumb
  // and it's not just a single "Dashboard" breadcrumb
  if (safeBreadcrumbs.length === 0) {
    return null;
  }

  // If there's only one breadcrumb, show it (but never if it's Dashboard)
  if (safeBreadcrumbs.length === 1) {
    return (
      <Breadcrumbs aria-label="breadcrumbs" sx={{ '&& > *': { fontSize: 14 }, mb: 2 }}>
        <Typography fontWeight={700}>{safeBreadcrumbs[0].label}</Typography>
      </Breadcrumbs>
    );
  }

  // Multiple breadcrumbs
  return (
    <Breadcrumbs aria-label="breadcrumbs" sx={{ '&& > *': { fontSize: 14 }, mb: 2 }}>
      {safeBreadcrumbs[0] && (
        <Link component={NextLink} href={safeBreadcrumbs[0].href} key="home" color="inherit">
          {safeBreadcrumbs[0].label}
        </Link>
      )}
      {safeBreadcrumbs.slice(1).map((breadcrumb, index) => (
        <span key={index}>
          {index === safeBreadcrumbs.length - 2 ? (
            <Typography fontWeight={700}>{breadcrumb.label}</Typography>
          ) : (
            <Link component={NextLink} key={breadcrumb.href} href={breadcrumb.href} color="inherit">
              {breadcrumb.label}
            </Link>
          )}
        </span>
      ))}
    </Breadcrumbs>
  );
};

export default DynamicBreadcrumbs;
