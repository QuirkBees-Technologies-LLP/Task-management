import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { DATABASE_NAME } from '../config';

/**
 * Resolves planName to planId by querying the Plans collection
 * @param planName - The plan name to resolve (camelCase from frontend)
 * @returns Object with planId (ObjectId | null) and resolvedPlanName (string)
 * @throws Error if planName is provided but plan is not found or inactive
 */
export async function resolvePlanNameToId(
  planName: string | undefined | null
): Promise<{ planId: ObjectId | null; resolvedPlanName: string }> {
  if (!planName || typeof planName !== 'string' || planName.trim() === '') {
    return { planId: null, resolvedPlanName: '' };
  }

  const trimmedPlanName = planName.trim();
  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const plansCollection = db.collection('plans');

  // Find plan by plan_name (case-insensitive exact match)
  const planDoc = await plansCollection.findOne({
    plan_name: { $regex: new RegExp(`^${trimmedPlanName}$`, 'i') },
    status: 'active',
    deletedAt: null,
  });

  if (!planDoc) {
    throw new Error(`Plan not found or inactive for the provided planName: ${trimmedPlanName}`);
  }

  return {
    planId: planDoc._id,
    resolvedPlanName: planDoc.plan_name, // Use canonical name from database
  };
}

/**
 * Resolves plan search term to plan IDs for filtering
 * @param planSearch - The search term to match against plan_name
 * @returns Array of plan ObjectIds that match the search
 */
export async function resolvePlanSearchToIds(
  planSearch: string | undefined | null
): Promise<ObjectId[]> {
  if (!planSearch || typeof planSearch !== 'string' || planSearch.trim() === '') {
    return [];
  }

  const trimmedSearch = planSearch.trim();
  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const plansCollection = db.collection('plans');

  // Find all plans matching the search term (case-insensitive partial match)
  const matchingPlans = await plansCollection
    .find({
      plan_name: { $regex: trimmedSearch, $options: 'i' },
      deletedAt: null,
    })
    .project({ _id: 1 })
    .toArray();

  return matchingPlans.map((plan) => plan._id);
}

