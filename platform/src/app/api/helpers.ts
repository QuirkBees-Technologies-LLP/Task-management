import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { JWT_SECRET } from './config';
import { getOrgIdFromRequest } from './lib/orgMiddleware';
import { ObjectId } from 'mongodb';

export const authApiRoutes = ['auth/login', 'auth/signup', 'auth/change-password'];

// ✅ Token verification helper
export async function verifyToken(request: Request, role?: string, superuser?: boolean) {
  const allowedRoles = [role];
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return { error: 'Token missing', status: 400 };

  try {
    const decoded = jwt.verify(token, JWT_SECRET!);

    // strictly check role
    if ((role && !allowedRoles.includes(decoded.role)) || (superuser && !decoded.superuser)) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { decoded };
  } catch {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

/**
 * Get org_id from request
 * This function extracts org_id from the request (either from URL slug or header)
 * and validates the organization exists and is active.
 * 
 * Usage:
 * ```typescript
 * const orgResult = await getOrgId(request);
 * if (orgResult.error) {
 *   return NextResponse.json({ error: orgResult.error }, { status: orgResult.status });
 * }
 * const org_id = orgResult.org_id;
 * ```
 */
export async function getOrgId(request: Request): Promise<{
  org_id?: ObjectId;
  error?: string;
  status: number;
}> {
  // First, try to get org_id from header (set by Next.js middleware)
  const headerOrgId = request.headers.get('x-org-id');
  if (headerOrgId && ObjectId.isValid(headerOrgId)) {
    const org_id = new ObjectId(headerOrgId);

    // Validate organization is active (quick check)
    const { validateOrganizationActive } = await import('./lib/orgMiddleware');
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
  }

  // Fallback: extract from URL (for API routes that don't go through Next.js middleware)
  return await getOrgIdFromRequest(request);
}

/**
 * Require org_id - throws error if not found
 * Use this when the endpoint MUST have an organization
 */
export async function requireOrgId(request: Request): Promise<ObjectId> {
  const result = await getOrgId(request);

  if (result.error || !result.org_id) {
    throw new Error(result.error || 'Organization ID is required');
  }

  return result.org_id;
}

export const userRolesServer = {
  admin: 'Admin',
  regular: 'Regular',
};

/**
 * Get org_id from decoded JWT token
 * Returns null if user is system admin or org_id is not present
 */
export function getOrgIdFromToken(decoded: any): ObjectId | null {
  if (!decoded) return null;

  // System admins don't have org_id
  if (decoded.isSystemAdmin === true) {
    return null;
  }

  // Try to get org_id from token
  if (decoded.org_id) {
    return new ObjectId(decoded.org_id);
  }

  return null;
}

/**
 * Require org_id from token - throws error if not found
 * Use this when the endpoint MUST have an organization (not for system admins)
 */
export function requireOrgIdFromToken(decoded: any): ObjectId {
  const org_id = getOrgIdFromToken(decoded);

  if (!org_id) {
    throw new Error('Organization ID is required. User must belong to an organization.');
  }

  return org_id;
}

/**
 * Verify user is an organization admin
 * Checks if user has admin role and belongs to an organization
 * Returns decoded token and org_id if valid
 */
export async function verifyOrgAdmin(request: Request): Promise<{
  decoded?: any;
  org_id?: ObjectId;
  error?: string;
  status: number;
}> {
  const tokenResult = await verifyToken(request, userRolesServer.admin);
  if (tokenResult.error) {
    return { error: tokenResult.error, status: tokenResult.status };
  }

  const decoded = tokenResult.decoded as any;

  // System admins are not org admins
  if (decoded.isSystemAdmin === true) {
    return {
      error: 'System admins cannot use organization admin endpoints',
      status: 403,
    };
  }

  // Get org_id from token
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return {
      error: 'User does not belong to an organization',
      status: 403,
    };
  }

  // Verify organization is active
  const { validateOrganizationActive } = await import('./lib/orgMiddleware');
  const isActive = await validateOrganizationActive(org_id);
  if (!isActive) {
    return {
      error: 'Organization is inactive',
      status: 403,
    };
  }

  return {
    decoded,
    org_id,
    status: 200,
  };
}

/**
 * Verify user can access a specific organization
 * Used when checking if user can access/modify data for a specific org
 */
export async function verifyOrgAccess(
  request: Request,
  targetOrgId: ObjectId
): Promise<{
  allowed: boolean;
  error?: string;
  status: number;
}> {
  // Check if system admin (can access any org)
  const systemAdminCheck = await verifySystemAdmin(request);
  if (!systemAdminCheck.error) {
    return { allowed: true, status: 200 };
  }

  // Get org_id from token
  const tokenResult = await verifyToken(request);
  if (tokenResult.error) {
    return { allowed: false, error: tokenResult.error, status: tokenResult.status };
  }

  const decoded = tokenResult.decoded as any;
  const userOrgId = getOrgIdFromToken(decoded);

  if (!userOrgId) {
    return {
      allowed: false,
      error: 'User does not belong to an organization',
      status: 403,
    };
  }

  // Check if user's org_id matches target org_id
  if (!userOrgId.equals(targetOrgId)) {
    return {
      allowed: false,
      error: 'Access denied. You can only access your own organization\'s data.',
      status: 403,
    };
  }

  return { allowed: true, status: 200 };
}

/**
 * Verify system admin token
 * Checks if the token contains isSystemAdmin: true
 * Used for superadmin APIs that require system-level access
 */
export async function verifySystemAdmin(request: Request) {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return { error: 'Token missing', status: 400 };

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET!);

    // Check if token has isSystemAdmin flag
    if (!decoded.isSystemAdmin) {
      return { error: 'System admin access required', status: 403 };
    }

    return { decoded };
  } catch {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

/**
 * Extract public ID from Cloudinary URL
 * Example: https://res.cloudinary.com/demo/image/upload/v1234567/folder/image.jpg
 * Returns: folder/image
 */
export function extractPublicId(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    // Cloudinary URL pattern: .../upload/v[version]/[public_id].[extension]
    // or .../upload/[public_id].[extension]
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Allowed origins for CORS
 */
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? [
    process.env.NEXT_PUBLIC_APP_URL,
    // Add your production origins here
  ].filter(Boolean) as string[]
  : [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];

/**
 * Add CORS headers to a NextResponse
 * @param response - The NextResponse to add headers to
 * @param origin - The origin from the request headers
 * @returns The response with CORS headers added
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  // Check if origin is allowed
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  // In development, allow all origins if not in the list
  const allowOrigin = isAllowedOrigin
    ? origin
    : (process.env.NODE_ENV === 'development' ? '*' : null);

  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-org-slug, x-org-id');

    // Only set credentials if NOT using wildcard (browser security requirement)
    if (allowOrigin !== '*') {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  return response;
}
