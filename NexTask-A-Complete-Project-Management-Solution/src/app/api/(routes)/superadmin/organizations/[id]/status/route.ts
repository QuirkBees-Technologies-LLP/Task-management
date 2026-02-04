import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../../config';
import { verifySystemAdmin } from '../../../../../helpers';

// PATCH: Update organization status (Enable/Disable) - SuperAdmin only
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
    const body = await request.json();
    const { status: newStatus } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    if (!newStatus || !['active', 'inactive'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'Status must be either "active" or "inactive"' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    const result = await organizationsCollection.updateOne(
      { _id: new ObjectId(id), deletedAt: null },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Organization ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`,
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



