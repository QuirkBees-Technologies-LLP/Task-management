/**
 * Database Migration Utilities
 * 
 * This file contains functions for managing database migrations,
 * including adding org_id to all collections and creating indexes.
 */

import { Collection, Db } from 'mongodb';
import clientPromise from './mongodb';
import { DATABASE_NAME } from '../config';

/**
 * Collections that need org_id field and indexes
 */
const COLLECTIONS_WITH_ORG_ID = [
  'users',
  'projects',
  'tasks',
  'taskSections', // sections collection
  'departments',
  'invoices',
  'notifications',
  'clients',
  'contracts',
  'userTasks',
  'rolesAndPermissions', // permissions collection
  'settings',
  'emailTemplates',
  'activity',
  'feedback',
  'support',
];

/**
 * Ensures org_id indexes exist on all collections
 * This function is idempotent - safe to call multiple times
 */
export async function ensureOrgIdIndexes(): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    console.log('Starting org_id index creation for all collections...');

    for (const collectionName of COLLECTIONS_WITH_ORG_ID) {
      try {
        const collection = db.collection(collectionName);

        // Create index on org_id
        await collection.createIndex(
          { org_id: 1 },
          {
            name: `${collectionName}_org_id_index`,
            background: true,
            sparse: true, // Sparse index allows documents without org_id (for backward compatibility)
          }
        ).catch((error: any) => {
          // Index might already exist (code 85 or 86)
          if (error.code !== 85 && error.code !== 86) {
            console.error(`Error creating org_id index on ${collectionName}:`, error);
          }
        });

        // Create compound index { org_id: 1, _id: 1 }
        await collection.createIndex(
          { org_id: 1, _id: 1 },
          {
            name: `${collectionName}_org_id_id_index`,
            background: true,
            sparse: true,
          }
        ).catch((error: any) => {
          if (error.code !== 85 && error.code !== 86) {
            console.error(`Error creating compound index on ${collectionName}:`, error);
          }
        });

        console.log(`✓ Indexes created for ${collectionName}`);
      } catch (error: any) {
        console.error(`Error processing collection ${collectionName}:`, error);
        // Continue with other collections even if one fails
      }
    }

    console.log('org_id indexes creation completed');
  } catch (error) {
    console.error('Error ensuring org_id indexes:', error);
    // Don't throw - this is a setup function that shouldn't break the app
  }
}

/**
 * Get all collections that should have org_id
 */
export function getCollectionsWithOrgId(): string[] {
  return [...COLLECTIONS_WITH_ORG_ID];
}

/**
 * Check if a collection should have org_id
 */
export function shouldHaveOrgId(collectionName: string): boolean {
  return COLLECTIONS_WITH_ORG_ID.includes(collectionName);
}

