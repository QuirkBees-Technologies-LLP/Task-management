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

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.plan_name !== undefined) {
      updateData.plan_name = body.plan_name;
    }
    if (body.description !== undefined) {
      updateData.description = body.description || '';
    }
    if (body.price !== undefined) {
      updateData.price = Number(body.price);
    }
    if (body.billing_period !== undefined) {
      updateData.billing_period = body.billing_period;
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


