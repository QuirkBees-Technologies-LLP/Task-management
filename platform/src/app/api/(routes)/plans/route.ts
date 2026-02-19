import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';

/**
 * Public Plans API
 * GET /api/plans
 * 
 * Returns all active plans available for public signup
 * No authentication required
 * Used by signup page to display available plans
 */
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Query only active, non-deleted plans, excluding Add-ons
    const { searchParams } = new URL(request.url);
    const isAddOn = searchParams.get('type') === 'add-on';

    const query = {
      status: 'active',
      deletedAt: null,
      type: isAddOn ? 'add-on' : { $ne: 'add-on' },
    };

    // Fetch all active plans, sorted by creation date (newest first)
    // You can add sorting by mark_as_popular or price if needed
    const plans = await plansCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Return only the fields needed for signup/payment page
    const publicPlans = plans.map((plan) => ({
      _id: plan._id.toString(),
      plan_name: plan.plan_name || '',
      description: plan.description || '',
      price: {
        // Treat 0 or negative values as \"not available\" so they don't show in UI
        monthly:
          typeof plan.price?.monthly === 'number' && plan.price.monthly > 0
            ? plan.price.monthly
            : null,
        yearly:
          typeof plan.price?.yearly === 'number' && plan.price.yearly > 0
            ? plan.price.yearly
            : null,
      },
      billing_period: plan.billing_period || [],
      trial_type: plan.trial_type || [],
      features: plan.features || [],
      best_for: plan.best_for || '',
      mark_as_popular: plan.mark_as_popular || false,
      users_allowed: plan.users_allowed ?? null,
      // Exclude internal fields like status, deletedAt, createdAt, etc.
    }));

    return NextResponse.json(
      {
        success: true,
        plans: publicPlans,
        count: publicPlans.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching public plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
