/**
 * Organization Type Definitions
 * 
 * Important Notes:
 * - _id (ObjectId) is the org_id - it NEVER changes
 * - slug is for URL routing only - it CAN change
 * - When slug changes, old URL stops working, new URL becomes active
 * - All data is stored using org_id, not slug
 */

export type OrganizationStatus = 'active' | 'inactive';

export interface Organization {
    _id: string; // This is the org_id - immutable
    name: string;
    slug: string; // Unique, changeable, used for URL routing
    slug_history?: string[]; // Track slug changes
    status: OrganizationStatus;
    ownerId: string; // Reference to users collection
    planId?: string; // Reference to plans collection (source of truth)
    planName?: string;
    planStartDate?: Date | string | null;
    planEndDate?: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    deletedAt?: Date | string | null; // For soft delete
    owner?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface CreateOrganizationRequest {
    name: string;
    slug: string;
    status?: OrganizationStatus;
    ownerName: string;
    ownerEmail: string;
    planName?: string;
    planStartDate?: string;
    planEndDate?: string;
}

export interface UpdateOrganizationRequest {
    name?: string;
    slug?: string;
    status?: OrganizationStatus;
    planName?: string;
    planStartDate?: string;
    planEndDate?: string;
}

export interface OrganizationResponse {
    success: boolean;
    organization?: Organization;
    organizations?: Organization[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    error?: string;
    message?: string;
}

