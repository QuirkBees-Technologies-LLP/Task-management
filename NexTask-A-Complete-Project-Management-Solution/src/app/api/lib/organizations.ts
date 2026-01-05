/**
 * Organizations Collection Utilities
 * 
 * This file contains helper functions for managing the organizations collection
 * and ensuring indexes are properly set up.
 */

import { Collection, Db } from 'mongodb';
import clientPromise from './mongodb';
import { DATABASE_NAME } from '../config';
import { ensureOrgIdIndexes } from './migrations';

/**
 * Ensures all required indexes exist on the organizations collection
 * This function is idempotent - safe to call multiple times
 */
export async function ensureOrganizationIndexes(): Promise<void> {
    try {
        const client = await clientPromise;
        const db = client.db(DATABASE_NAME);
        const organizationsCollection = db.collection('organizations');

        // Create unique index on slug (only for non-deleted organizations)
        // This ensures slug uniqueness while allowing soft-deleted orgs to reuse slugs
        await organizationsCollection.createIndex(
            { slug: 1 },
            {
                unique: true,
                partialFilterExpression: { deletedAt: null },
                name: 'slug_unique_index',
                background: true,
            }
        ).catch((error: any) => {
            // Index might already exist (code 85 or 86)
            if (error.code !== 85 && error.code !== 86) {
                console.error('Error creating slug index:', error);
            }
        });

        // Create index on status for filtering active/inactive organizations
        await organizationsCollection.createIndex(
            { status: 1 },
            { name: 'status_index', background: true }
        ).catch((error: any) => {
            if (error.code !== 85 && error.code !== 86) {
                console.error('Error creating status index:', error);
            }
        });

        // Create index on deletedAt for soft delete queries
        await organizationsCollection.createIndex(
            { deletedAt: 1 },
            { name: 'deletedAt_index', background: true }
        ).catch((error: any) => {
            if (error.code !== 85 && error.code !== 86) {
                console.error('Error creating deletedAt index:', error);
            }
        });

        // Create compound index for common queries (status + deletedAt)
        await organizationsCollection.createIndex(
            { status: 1, deletedAt: 1 },
            { name: 'status_deletedAt_index', background: true }
        ).catch((error: any) => {
            if (error.code !== 85 && error.code !== 86) {
                console.error('Error creating compound index:', error);
            }
        });

        // Create index on ownerId for owner lookups
        await organizationsCollection.createIndex(
            { ownerId: 1 },
            { name: 'ownerId_index', background: true }
        ).catch((error: any) => {
            if (error.code !== 85 && error.code !== 86) {
                console.error('Error creating ownerId index:', error);
            }
        });

        console.log('Organization indexes ensured successfully');

        // Also ensure org_id indexes on all collections
        await ensureOrgIdIndexes();
    } catch (error) {
        console.error('Error ensuring organization indexes:', error);
        // Don't throw - this is a setup function that shouldn't break the app
    }
}

/**
 * Get organizations collection
 */
export async function getOrganizationsCollection(): Promise<Collection> {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    return db.collection('organizations');
}

/**
 * Validate slug format
 * Slug must contain only lowercase letters, numbers, and hyphens
 */
export function validateSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug) && slug.length > 0 && slug.length <= 50;
}

/**
 * Normalize slug (lowercase, trim, replace spaces with hyphens)
 */
export function normalizeSlug(slug: string): string {
    return slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

