import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifySystemAdmin } from '../../../helpers';
import { stripe } from '@/utils/stripe';

// GET /api/superadmin/plans?page=&limit=
export async function GET(request: Request) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const billingPeriodFilter = searchParams.get('billingPeriod') || '';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Build query
    const query: any = { deletedAt: null };

    // Global search: search across plan fields
    if (search) {
      const searchConditions: any[] = [
        { plan_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { best_for: { $regex: search, $options: 'i' } },
        { 'billing_period': { $regex: search, $options: 'i' } },
        { 'plan_type': { $regex: search, $options: 'i' } },
        { 'trial_type': { $regex: search, $options: 'i' } },
        { 'access_level': { $regex: search, $options: 'i' } },
        { 'features': { $regex: search, $options: 'i' } },
      ];

      // Try to parse as number for price search (search in price.monthly and price.yearly)
      const searchNumber = parseFloat(search);
      if (!isNaN(searchNumber)) {
        searchConditions.push(
          { 'price.monthly': searchNumber },
          { 'price.yearly': searchNumber }
        );
      }

      // Try to parse as number for users_allowed and organizations_allowed
      if (!isNaN(searchNumber)) {
        searchConditions.push(
          { users_allowed: searchNumber },
          { organizations_allowed: searchNumber }
        );
      }

      query.$or = searchConditions;
    }

    // Scope-based filters
    if (statusFilter) {
      query.status = statusFilter;
    }

    if (billingPeriodFilter) {
      query.billing_period = { $in: [billingPeriodFilter] };
    }

    const total = await plansCollection.countDocuments(query);
    const skip = (page - 1) * limit;

    const plans = await plansCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        plans: plans.map((plan) => ({
          ...plan,
          _id: plan._id.toString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ message: 'Failed to fetch plans' }, { status: 500 });
  }
}

// POST /api/superadmin/plans
export async function POST(request: Request) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const body = await request.json();
    let {
      plan_name,
      description,
      plan_type = [],
      trial_type = [],
      price = {},
      billing_period = [],
      users_allowed,
      organizations_allowed,
      best_for = '',
      access_level = [],
      features = [],
      mark_as_popular = false,
      status = 'active',
      type = 'normal', // 'normal' | 'add-on'
    } = body;

    // Normalize potential string inputs to arrays
    if (typeof plan_type === 'string') plan_type = [plan_type];
    
    if (type === 'add-on') {
        trial_type = [];
    } else {
        if (typeof trial_type === 'string') trial_type = [trial_type];
    }
    
    // Handle 'both' or string conversion for billing_period
    if (typeof billing_period === 'string') {
        if (billing_period === 'both') {
            billing_period = ['monthly', 'yearly'];
        } else {
            billing_period = [billing_period];
        }
    }

    if (typeof access_level === 'string') access_level = [access_level];
    if (typeof features === 'string') features = [features];

    if (!plan_name || typeof plan_name !== 'string') {
      return NextResponse.json({ message: 'Plan name is required' }, { status: 400 });
    }

    // Validate price object structure
    if (!price || typeof price !== 'object' || Array.isArray(price)) {
      return NextResponse.json({ message: 'Price must be an object with monthly and/or yearly properties' }, { status: 400 });
    }

    // Validate plan_type array
    if (!Array.isArray(plan_type)) {
      return NextResponse.json({ message: 'plan_type must be an array' }, { status: 400 });
    }

    // Validate trial_type array
    if (!Array.isArray(trial_type)) {
      return NextResponse.json({ message: 'trial_type must be an array' }, { status: 400 });
    }

    // Validate billing_period array
    if (!Array.isArray(billing_period)) {
      return NextResponse.json({ message: 'billing_period must be an array' }, { status: 400 });
    }

    // Validate access_level array
    if (!Array.isArray(access_level)) {
      return NextResponse.json({ message: 'access_level must be an array' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    const now = new Date();

    // Normalize billing period (values are lower-case: 'monthly', 'yearly')
    const normalizedBillingPeriod = Array.isArray(billing_period) ? billing_period : [];
    const hasMonthly = normalizedBillingPeriod.includes('monthly');
    const hasYearly = normalizedBillingPeriod.includes('yearly');

    const newPlan = {
      plan_name,
      description: description || '',
      plan_type: Array.isArray(plan_type) ? plan_type : [],
      trial_type: Array.isArray(trial_type) ? trial_type : [],
      price: {
        // Only store monthly price if Monthly billing period is enabled
        monthly:
          hasMonthly &&
          price.monthly !== undefined &&
          price.monthly !== null &&
          price.monthly !== ''
            ? Number(price.monthly)
            : null,
        // Only store yearly price if Yearly billing period is enabled
        yearly:
          hasYearly &&
          price.yearly !== undefined &&
          price.yearly !== null &&
          price.yearly !== ''
            ? Number(price.yearly)
            : null,
      },
      billing_period: normalizedBillingPeriod,
      users_allowed: users_allowed !== undefined ? Number(users_allowed) : null,
      organizations_allowed: organizations_allowed !== undefined ? Number(organizations_allowed) : null,
      best_for: best_for || '',
      access_level: Array.isArray(access_level) ? access_level : [],
      features: Array.isArray(features) ? features : [],
      mark_as_popular: Boolean(mark_as_popular),
      status: status || 'active',
      type: type || 'normal',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      stripe_product_id: '',
      stripe_price_ids: {
        monthly: null,
        yearly: null,
      },
    };

    // Integrate Stripe: Create Product and Prices
    if (stripe) {
      try {
        // 1. Create Product
        const stripeProduct = await stripe.products.create({
          name: plan_name,
          description: description || undefined,
          metadata: {
            plan_type: Array.isArray(plan_type) ? plan_type.join(',') : '',
            features: Array.isArray(features) ? features.join(',').substring(0, 500) : '',
            type: type || 'normal',
            users_allowed: String(users_allowed || 0),
          },
        });

        newPlan.stripe_product_id = stripeProduct.id;

        // 2. Create Prices
        // Monthly
        if (newPlan.price.monthly) {
          const monthlyPrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(newPlan.price.monthly * 100), // cents
            currency: 'usd', // Defaulting to USD, make dynamic if needed
            recurring: { interval: 'month' },
            metadata: {
              plan_type: 'monthly',
            },
          });
          // @ts-ignore
          newPlan.stripe_price_ids.monthly = monthlyPrice.id;
        }

        // Yearly
        if (newPlan.price.yearly) {
          const yearlyPrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(newPlan.price.yearly * 100), // cents
            currency: 'usd',
            recurring: { interval: 'year' },
            metadata: {
              plan_type: 'yearly',
            },
          });
          // @ts-ignore
          newPlan.stripe_price_ids.yearly = yearlyPrice.id;
        }

      } catch (stripeError: any) {
        console.error('Error creating Stripe product/prices:', stripeError);
        // Option: return error and abort plan creation? 
        // For now, valid to return error so manual clean up isn't needed.
        return NextResponse.json(
          { message: `Failed to create Stripe resources: ${stripeError.message}` },
          { status: 500 }
        );
      }
    }

    const result = await plansCollection.insertOne(newPlan);

    return NextResponse.json(
      {
        success: true,
        plan: {
          ...newPlan,
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ message: 'Failed to create plan' }, { status: 500 });
  }
}


