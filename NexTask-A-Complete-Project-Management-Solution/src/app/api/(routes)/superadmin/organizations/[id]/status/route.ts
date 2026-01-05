import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../../config';
import { verifySystemAdmin } from '../../../../../helpers';

/**
 * PATCH: Update organization status (active/inactive)
 * SuperAdmin only endpoint
 * 
 * When status is set to "inactive":
 * - Blocks all org logins
 * 
 * When status is set to "active":
 * - Allows logins again
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Verify JWT
  // 2. Ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status: newStatus } = body;

    // Validate status value
    if (!newStatus || (newStatus !== 'active' && newStatus !== 'inactive')) {
      return NextResponse.json(
        { error: 'Status must be either "active" or "inactive"' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    // Check if organization exists and is not deleted
    const existingOrg = await organizationsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update organization status
    const result = await organizationsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Return success with new status
    return NextResponse.json(
      {
        success: true,
        status: newStatus,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating organization status:', error);
    return NextResponse.json(
      { error: 'Failed to update organization status' },
      { status: 500 }
    );
  }
}

