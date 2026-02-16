import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifySystemAdmin } from '../../../../helpers';
import { ObjectId } from 'mongodb';

// GET /api/superadmin/plans/:id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    const plan = await plansCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!plan) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        plan: {
          ...plan,
          _id: plan._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ message: 'Failed to fetch plan' }, { status: 500 });
  }
}

// PATCH /api/superadmin/plans/:id
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
    }

    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Fetch existing plan to preserve values when partially updating
    const existingPlan = await plansCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!existingPlan) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.plan_name !== undefined) {
      updateData.plan_name = body.plan_name;
    }
    if (body.description !== undefined) {
      updateData.description = body.description || '';
    }
    if (body.plan_type !== undefined) {
      updateData.plan_type = Array.isArray(body.plan_type) ? body.plan_type : [];
    }
    if (body.trial_type !== undefined) {
      updateData.trial_type = Array.isArray(body.trial_type) ? body.trial_type : [];
    }

    // Determine effective billing period for price rules (values are lower-case)
    const newBillingPeriod =
      body.billing_period !== undefined
        ? Array.isArray(body.billing_period)
          ? body.billing_period
          : []
        : existingPlan.billing_period || [];
    const hasMonthly = newBillingPeriod.includes('monthly');
    const hasYearly = newBillingPeriod.includes('yearly');

    if (body.price !== undefined) {
      if (typeof body.price === 'object' && !Array.isArray(body.price)) {
        // Preserve existing price values and only update provided fields,
        // but also respect the effective billing period
        const existingPrice = existingPlan.price || { monthly: null, yearly: null };
        updateData.price = {
          monthly: hasMonthly
            ? body.price.monthly !== undefined
              ? body.price.monthly !== null && body.price.monthly !== ''
                ? Number(body.price.monthly)
                : null
              : existingPrice.monthly
            : null, // If Monthly is not enabled, force null
          yearly: hasYearly
            ? body.price.yearly !== undefined
              ? body.price.yearly !== null && body.price.yearly !== ''
                ? Number(body.price.yearly)
                : null
              : existingPrice.yearly
            : null, // If Yearly is not enabled, force null
        };
      }
    }

    if (body.billing_period !== undefined) {
      updateData.billing_period = newBillingPeriod;
    }
    if (body.users_allowed !== undefined) {
      updateData.users_allowed = body.users_allowed !== null ? Number(body.users_allowed) : null;
    }
    if (body.organizations_allowed !== undefined) {
      updateData.organizations_allowed = body.organizations_allowed !== null ? Number(body.organizations_allowed) : null;
    }
    if (body.best_for !== undefined) {
      updateData.best_for = body.best_for || '';
    }
    if (body.access_level !== undefined) {
      updateData.access_level = Array.isArray(body.access_level) ? body.access_level : [];
    }
    if (body.features !== undefined) {
      updateData.features = Array.isArray(body.features) ? body.features : [];
    }
    if (body.mark_as_popular !== undefined) {
      updateData.mark_as_popular = Boolean(body.mark_as_popular);
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const result = await plansCollection.updateOne(
      { _id: new ObjectId(id), deletedAt: null },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    const updatedPlan = await plansCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      {
        success: true,
        plan: {
          ...updatedPlan,
          _id: updatedPlan!._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ message: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE /api/superadmin/plans/:id (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    const result = await plansCollection.updateOne(
      { _id: new ObjectId(id), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Plan deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ message: 'Failed to delete plan' }, { status: 500 });
  }
}


