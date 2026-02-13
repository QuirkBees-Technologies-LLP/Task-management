/**
 * Example API Route Using Organization Middleware
 * 
 * This file demonstrates how to use the organization middleware in API routes.
 * DELETE THIS FILE after reviewing the pattern.
 */

import { NextResponse } from 'next/server';
import { getOrgId, verifyToken } from '../../helpers';
import { addOrgIdToQuery } from '../../lib/orgIdHelper';

// Example: GET endpoint that requires org_id
export async function GET(request: Request) {
  // 1. Verify authentication
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  // 2. Get org_id from request (resolves slug → org_id)
  const orgResult = await getOrgId(request);
  if (orgResult.error) {
    return NextResponse.json(
      { error: orgResult.error },
      { status: orgResult.status }
    );
  }

  // 3. If org_id is required but not found, return error
  if (!orgResult.org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    );
  }

  const org_id = orgResult.org_id;

  try {
    // 4. Use org_id in queries
    const query = addOrgIdToQuery({}, org_id);
    
    // Example: Fetch data scoped to organization
    // const data = await collection.find(query).toArray();

    return NextResponse.json({
      success: true,
      org_id: org_id.toString(),
      message: 'Organization middleware working correctly',
    });
  } catch (error: any) {
    console.error('Error in example route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

