/**
 * Organization ID Helper Functions
 * 
 * Utility functions for working with org_id across the application.
 * These functions help ensure org_id is properly handled in queries.
 */

import { ObjectId } from 'mongodb';

/**
 * Add org_id to a query object if orgId is provided
 * This ensures backward compatibility - queries without orgId still work
 */
export function addOrgIdToQuery(query: any, orgId?: string | ObjectId | null): any {
  if (!orgId) {
    // If no orgId provided, return query as-is (backward compatible)
    return query;
  }

  // Add org_id to query
  return {
    ...query,
    org_id: orgId instanceof ObjectId ? orgId : new ObjectId(orgId),
  };
}

/**
 * Add org_id to a document before insertion
 */
export function addOrgIdToDocument(document: any, orgId?: string | ObjectId | null): any {
  if (!orgId) {
    // If no orgId provided, return document as-is (backward compatible)
    return document;
  }

  return {
    ...document,
    org_id: orgId instanceof ObjectId ? orgId : new ObjectId(orgId),
  };
}

/**
 * Validate if orgId is a valid ObjectId
 */
export function isValidOrgId(orgId: string | ObjectId | null | undefined): boolean {
  if (!orgId) return false;
  try {
    if (orgId instanceof ObjectId) return true;
    return ObjectId.isValid(orgId);
  } catch {
    return false;
  }
}

/**
 * Convert orgId to ObjectId safely
 */
export function toOrgIdObjectId(orgId: string | ObjectId | null | undefined): ObjectId | null {
  if (!orgId) return null;
  if (orgId instanceof ObjectId) return orgId;
  if (ObjectId.isValid(orgId)) return new ObjectId(orgId);
  return null;
}

