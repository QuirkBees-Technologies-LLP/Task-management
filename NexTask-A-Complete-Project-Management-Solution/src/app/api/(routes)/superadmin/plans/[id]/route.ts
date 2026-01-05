import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifySystemAdmin } from '../../../../helpers';

/**
 * GET: Fetch single plan by ID
 * SuperAdmin only endpoint
 * Returns plan with consistent field structure
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify JWT and ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid plan ID format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Find plan by _id, excluding soft-deleted ones
    const plan = await plansCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Return plan with consistent field structure
    return NextResponse.json(
      {
        success: true,
        plan: {
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
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update plan details
 * SuperAdmin only endpoint
 * Accepts and returns plan with consistent field structure
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify JWT and ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid plan ID format' },
        { status: 400 }
      );
    }

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

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Check if plan exists and is not deleted
    const existingPlan = await plansCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Validate and update plan_name if provided
    if (plan_name !== undefined) {
      if (typeof plan_name !== 'string' || plan_name.trim().length < 1 || plan_name.trim().length > 100) {
        return NextResponse.json(
          { error: 'plan_name must be a string between 1 and 100 characters' },
          { status: 400 }
        );
      }

      const trimmedPlanName = plan_name.trim();

      // Check if plan_name is being changed
      if (trimmedPlanName !== existingPlan.plan_name) {
        // Check if new plan_name already exists (case-insensitive)
        const planNameExists = await plansCollection.findOne({
          plan_name: { $regex: new RegExp(`^${trimmedPlanName}$`, 'i') },
          deletedAt: null,
          _id: { $ne: new ObjectId(id) },
        });

        if (planNameExists) {
          return NextResponse.json(
            { error: 'Plan with this name already exists' },
            { status: 409 }
          );
        }
      }

      updateData.plan_name = trimmedPlanName;
    }

    // Validate and update description if provided
    if (description !== undefined) {
      if (typeof description !== 'string' || description.length > 500) {
        return NextResponse.json(
          { error: 'description must be a string with max 500 characters' },
          { status: 400 }
        );
      }
      updateData.description = description;
    }

    // Validate and update price if provided
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return NextResponse.json(
          { error: 'price must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.price = price;
    }

    // Validate and update status if provided
    if (status !== undefined) {
      if (status !== 'active' && status !== 'inactive') {
        return NextResponse.json(
          { error: 'status must be either "active" or "inactive"' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Validate and update billing_period if provided
    if (billing_period !== undefined) {
      if (billing_period !== 'monthly' && billing_period !== 'yearly') {
        return NextResponse.json(
          { error: 'billing_period must be either "monthly" or "yearly"' },
          { status: 400 }
        );
      }
      updateData.billing_period = billing_period;
    }

    // Validate and update features if provided
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
      updateData.features = features;
    }

    // Validate and update mark_as_popular if provided
    if (mark_as_popular !== undefined) {
      if (typeof mark_as_popular !== 'boolean') {
        return NextResponse.json(
          { error: 'mark_as_popular must be a boolean' },
          { status: 400 }
        );
      }
      updateData.mark_as_popular = mark_as_popular;
    }

    // Update the plan
    const result = await plansCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Fetch updated plan
    const updatedPlan = await plansCollection.findOne({
      _id: new ObjectId(id),
    });

    // Return updated plan with consistent field structure
    return NextResponse.json(
      {
        success: true,
        plan: {
          _id: updatedPlan!._id.toString(),
          plan_name: updatedPlan!.plan_name,
          description: updatedPlan!.description,
          price: updatedPlan!.price,
          status: updatedPlan!.status,
          billing_period: updatedPlan!.billing_period,
          features: updatedPlan!.features || [],
          mark_as_popular: updatedPlan!.mark_as_popular || false,
          createdAt: updatedPlan!.createdAt,
          updatedAt: updatedPlan!.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating plan:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Plan with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Soft delete plan
 * SuperAdmin only endpoint
 * Sets deletedAt timestamp instead of permanently deleting
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify JWT and ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid plan ID format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Check if plan exists (including already soft-deleted ones for this check)
    const existingPlan = await plansCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Check if already soft-deleted
    if (existingPlan.deletedAt) {
      return NextResponse.json(
        { error: 'Plan already deleted' },
        { status: 404 }
      );
    }

    // Soft delete: Set deletedAt timestamp
    const result = await plansCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Plan deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}

