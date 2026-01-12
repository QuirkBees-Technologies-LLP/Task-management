import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifySystemAdmin } from '../../../helpers';

/**
 * GET: Fetch all plans
 * SuperAdmin only endpoint
 * Returns plans with consistent field structure
 */
export async function GET(request: Request) {
  // Verify JWT and ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Build query
    const query: any = { deletedAt: null };
    if (statusFilter && (statusFilter === 'active' || statusFilter === 'inactive')) {
      query.status = statusFilter;
    }

    // Global search: search across all relevant fields with partial, case-insensitive matching
    if (search) {
      const searchConditions: any[] = [
        { plan_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { billing_period: { $regex: search, $options: 'i' } },
      ];

      // Search in price - try exact numeric match first
      const searchNum = parseFloat(search);
      if (!isNaN(searchNum)) {
        searchConditions.push({ price: searchNum });
      }
      
      // Search price as string representation for partial matching (e.g., "99" matches "199")
      searchConditions.push({ 
        $expr: { 
          $regexMatch: { 
            input: { $toString: '$price' }, 
            regex: search, 
            options: 'i' 
          } 
        } 
      });

      // Search in features array (partial match in any feature string)
      searchConditions.push({ 
        features: { 
          $elemMatch: { 
            $regex: search, 
            $options: 'i' 
          } 
        } 
      });

      query.$or = searchConditions;
    }

    // Fetch plans with pagination
    const [plans, total] = await Promise.all([
      plansCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      plansCollection.countDocuments(query),
    ]);

    // Format plans with consistent field structure
    const formattedPlans = plans.map((plan) => ({
      _id: plan._id.toString(),
      plan_name: plan.plan_name,
      description: plan.description,
      price: plan.price,
      status: plan.status,
      billing_period: plan.billing_period,
      features: plan.features || [],
      mark_as_popular: plan.mark_as_popular || false,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        plans: formattedPlans,
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
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new plan
 * SuperAdmin only endpoint
 * Accepts and returns plan with consistent field structure
 */
export async function POST(request: Request) {
  // Verify JWT and ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const body = await request.json();
    const {
      plan_name,
      description,
      price,
      status,
      billing_period,
      features,
      mark_as_popular,
    } = body;

    // Validate required fields
    if (!plan_name || description === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'plan_name, description, and price are required' },
        { status: 400 }
      );
    }

    // Validate plan_name
    if (typeof plan_name !== 'string' || plan_name.trim().length < 1 || plan_name.trim().length > 100) {
      return NextResponse.json(
        { error: 'plan_name must be a string between 1 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate description
    if (typeof description !== 'string' || description.length > 500) {
      return NextResponse.json(
        { error: 'description must be a string with max 500 characters' },
        { status: 400 }
      );
    }

    // Validate price
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'price must be a non-negative number' },
        { status: 400 }
      );
    }

    // Validate status
    if (status !== undefined && status !== 'active' && status !== 'inactive') {
      return NextResponse.json(
        { error: 'status must be either "active" or "inactive"' },
        { status: 400 }
      );
    }

    // Validate billing_period
    if (billing_period !== undefined && billing_period !== 'monthly' && billing_period !== 'yearly') {
      return NextResponse.json(
        { error: 'billing_period must be either "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // Validate features
    if (features !== undefined) {
      if (!Array.isArray(features)) {
        return NextResponse.json(
          { error: 'features must be an array of strings' },
          { status: 400 }
        );
      }
      if (!features.every((f: any) => typeof f === 'string')) {
        return NextResponse.json(
          { error: 'All features must be strings' },
          { status: 400 }
        );
      }
    }

    // Validate mark_as_popular
    if (mark_as_popular !== undefined && typeof mark_as_popular !== 'boolean') {
      return NextResponse.json(
        { error: 'mark_as_popular must be a boolean' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Check if plan_name already exists (case-insensitive)
    const existingPlan = await plansCollection.findOne({
      plan_name: { $regex: new RegExp(`^${plan_name.trim()}$`, 'i') },
      deletedAt: null,
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Plan with this name already exists' },
        { status: 409 }
      );
    }

    // Create plan document with consistent field structure
    const planData = {
      plan_name: plan_name.trim(),
      description: description || '',
      price: price,
      status: status || 'active',
      billing_period: billing_period || 'monthly',
      features: features || [],
      mark_as_popular: mark_as_popular || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const result = await plansCollection.insertOne(planData);

    // Return created plan with consistent field structure
    const createdPlan = await plansCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      {
        success: true,
        plan: {
          _id: createdPlan!._id.toString(),
          plan_name: createdPlan!.plan_name,
          description: createdPlan!.description,
          price: createdPlan!.price,
          status: createdPlan!.status,
          billing_period: createdPlan!.billing_period,
          features: createdPlan!.features || [],
          mark_as_popular: createdPlan!.mark_as_popular || false,
          createdAt: createdPlan!.createdAt,
          updatedAt: createdPlan!.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating plan:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Plan with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}

