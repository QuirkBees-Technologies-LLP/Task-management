/**
 * Organization Middleware
 * 
 * This middleware extracts organization slug from the request and resolves it to org_id.
 * It validates the organization exists and is active, then attaches org_id to the request.
 * 
 * Rules:
 * - Slug → org_id resolution happens once per request
 * - Backend never trusts slug after this point
 * - All requests must have req.org_id after this middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { DATABASE_NAME } from '../config';

// Cache for slug → org_id mapping (in-memory, short-lived)
// This reduces database lookups for frequently accessed organizations
const slugCache = new Map<string, { org_id: ObjectId; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract slug from URL path or request headers
 * Supports patterns like:
 * - /api/{slug}/...
 * - /{slug}/dashboard/...
 * - /{slug}/api/...
 * Also checks x-org-slug header set by Next.js middleware
 */
export function extractSlugFromPath(pathname: string, headers?: Headers): string | null {
  // First, check header (set by Next.js middleware)
  if (headers) {
    const headerSlug = headers.get('x-org-slug');
    if (headerSlug) {
      return headerSlug.toLowerCase();
    }
  }

  // Remove leading and trailing slashes
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath.split('/');

  // Skip common prefixes
  const skipPrefixes = ['api', 'dashboard', 'auth', 'admin'];
  
  // Find first segment that's not a skip prefix
  for (const segment of segments) {
    if (segment && !skipPrefixes.includes(segment.toLowerCase())) {
      // Validate slug format (alphanumeric and hyphens)
      if (/^[a-z0-9-]+$/i.test(segment)) {
        return segment.toLowerCase();
      }
    }
  }

  return null;
}

/**
 * Resolve slug to org_id
 * Uses cache to reduce database lookups
 */
export async function resolveSlugToOrgId(slug: string): Promise<ObjectId | null> {
  if (!slug) return null;

  // Check cache first
  const cached = slugCache.get(slug);
  if (cached && cached.expires > Date.now()) {
    return cached.org_id;
  }

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    const organization = await organizationsCollection.findOne({
      slug: slug.toLowerCase(),
      deletedAt: null,
    });

    if (!organization) {
      return null;
    }

    const org_id = organization._id instanceof ObjectId 
      ? organization._id 
      : new ObjectId(organization._id);

    // Cache the result
    slugCache.set(slug, {
      org_id,
      expires: Date.now() + CACHE_TTL,
    });

    // Log slug → org_id mapping (for debugging/monitoring)
    console.log(`[Org Middleware] Resolved slug "${slug}" → org_id "${org_id}"`);

    return org_id;
  } catch (error) {
    console.error('Error resolving slug to org_id:', error);
    return null;
  }
}

/**
 * Validate organization is active
 */
export async function validateOrganizationActive(org_id: ObjectId): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    const organization = await organizationsCollection.findOne({
      _id: org_id,
      deletedAt: null,
      status: 'active',
    });

    return !!organization;
  } catch (error) {
    console.error('Error validating organization:', error);
    return false;
  }
}

/**
 * Organization middleware for API routes
 * 
 * Usage in API route:
 * ```typescript
 * const orgResult = await getOrgIdFromRequest(request);
 * if (orgResult.error) {
 *   return NextResponse.json({ error: orgResult.error }, { status: orgResult.status });
 * }
 * const org_id = orgResult.org_id;
 * ```
 */
export async function getOrgIdFromRequest(
  request: Request | NextRequest
): Promise<{
  org_id?: ObjectId;
  error?: string;
  status: number;
}> {
  try {
    // Extract slug from URL or headers
    const url = new URL(request.url);
    const headers = request instanceof Request ? request.headers : undefined;
    const slug = extractSlugFromPath(url.pathname, headers);

    if (!slug) {
      // No slug in URL - this might be a global/admin endpoint
      // Return success but no org_id (some endpoints don't need org_id)
      return { status: 200 };
    }

    // Resolve slug to org_id
    const org_id = await resolveSlugToOrgId(slug);

    if (!org_id) {
      return {
        error: 'Organization not found',
        status: 404,
      };
    }

    // Validate organization is active
    const isActive = await validateOrganizationActive(org_id);

    if (!isActive) {
      return {
        error: 'Organization is inactive',
        status: 403,
      };
    }

    return {
      org_id,
      status: 200,
    };
  } catch (error: any) {
    console.error('Error in organization middleware:', error);
    return {
      error: 'Failed to resolve organization',
      status: 500,
    };
  }
}

/**
 * Require org_id middleware - throws error if org_id is not found
 * Use this when the endpoint MUST have an organization
 */
export async function requireOrgId(
  request: Request | NextRequest
): Promise<ObjectId> {
  const result = await getOrgIdFromRequest(request);
  
  if (result.error || !result.org_id) {
    throw new Error(result.error || 'Organization ID is required');
  }
  
  return result.org_id;
}

/**
 * Clear cache for a specific slug (useful when slug changes)
 */
export function clearSlugCache(slug: string): void {
  slugCache.delete(slug.toLowerCase());
}

/**
 * Clear all cached slugs
 */
export function clearAllSlugCache(): void {
  slugCache.clear();
}

