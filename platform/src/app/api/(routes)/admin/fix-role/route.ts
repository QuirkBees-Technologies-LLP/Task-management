import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifySystemAdmin } from '../../../helpers';
import { userRolesServer } from '../../../helpers';

/**
 * Utility endpoint to fix owner roles for organizations
 * SuperAdmin only - for fixing existing organizations where owner has wrong role
 */
export async function POST(request: Request) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const organizationsCollection = db.collection('organizations');

    // Find the user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is an organization owner
    const org = await organizationsCollection.findOne({ ownerId: user._id });
    if (!org) {
      return NextResponse.json(
        { error: 'User is not an organization owner' },
        { status: 400 }
      );
    }

    // Get current role
    const currentRole = user.role;
    const expectedRole = userRolesServer.admin;

    // Update role if it's wrong
    if (currentRole !== expectedRole) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { role: expectedRole } }
      );

      return NextResponse.json(
        {
          success: true,
          message: `Role updated from "${currentRole}" to "${expectedRole}"`,
          user: {
            email: user.email,
            oldRole: currentRole,
            newRole: expectedRole,
            org_id: user.org_id,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User already has correct role',
        user: {
          email: user.email,
          role: currentRole,
          org_id: user.org_id,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fixing user role:', error);
    return NextResponse.json(
      { error: 'Failed to fix user role' },
      { status: 500 }
    );
  }
}



