import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifySystemAdmin } from '../../../helpers';

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

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    const query: any = { deletedAt: null };

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
    const {
      plan_name,
      description,
      price,
      billing_period,
      features = [],
      mark_as_popular = false,
      status = 'active',
    } = body;

    if (!plan_name || typeof plan_name !== 'string') {
      return NextResponse.json({ message: 'Plan name is required' }, { status: 400 });
    }

    if (price === undefined || price === null || Number.isNaN(Number(price))) {
      return NextResponse.json({ message: 'Price is required' }, { status: 400 });
    }

    if (!billing_period || !['monthly', 'yearly'].includes(billing_period)) {
      return NextResponse.json({ message: 'Billing period must be monthly or yearly' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    const now = new Date();
    const newPlan = {
      plan_name,
      description: description || '',
      price: Number(price),
      billing_period,
      features: Array.isArray(features) ? features : [],
      mark_as_popular: Boolean(mark_as_popular),
      status: status || 'active',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

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


