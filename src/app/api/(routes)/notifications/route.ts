import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { ObjectId } from 'mongodb';
import { verifyToken, getOrgIdFromToken } from '../../helpers';

// ✅ GET: Fetch notifications for a user (filtered by organization)
export async function GET(request: NextRequest) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const userId = (decoded as any).id;

  // Get org_id from token for organization scoping
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 403 }
    );
  }

  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    // Verify user belongs to the organization
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
      org_id: org_id instanceof ObjectId ? org_id : new ObjectId(org_id)
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in organization' },
        { status: 403 }
      );
    }

    const orgObjectId = org_id instanceof ObjectId ? org_id : new ObjectId(org_id);
    const query = db
      .collection('notifications')
      .find({
        userId: new ObjectId(userId),
        org_id: orgObjectId // Filter by organization
      })
      .sort({ createdAt: -1 });

    const notifications = limit ? await query.limit(limit).toArray() : await query.toArray();

    return NextResponse.json(notifications, { status: 200 });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// ✅ POST: Create a notification (with org_id)
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const userId = (decoded as any).userId || (decoded as any).id;

  // Get org_id from token for organization scoping
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { message, type = 'info' } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const orgObjectId = org_id instanceof ObjectId ? org_id : new ObjectId(org_id);

    const notification = {
      userId: new ObjectId(userId),
      org_id: orgObjectId, // Add org_id to notification
      message,
      type,
      read: false,
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const result = await db.collection('notifications').insertOne(notification);

    return NextResponse.json(
      { message: 'Notification created', _id: result.insertedId },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating notification:', err);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// ✅ PUT: Mark one or more notifications as read (with org_id check)
export async function PUT(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const userId = (decoded as any).id;

  // Get org_id from token for organization scoping
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, read } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Validate read parameter (should be boolean)
    if (read !== undefined && typeof read !== 'boolean') {
      return NextResponse.json({ error: 'Read parameter must be a boolean' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const orgObjectId = org_id instanceof ObjectId ? org_id : new ObjectId(org_id);

    // Use provided read value, or default to true for backward compatibility
    const readValue = read !== undefined ? read : true;

    const result = await db
      .collection('notifications')
      .updateOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
        org_id: orgObjectId // Ensure notification belongs to user's organization
      }, { $set: { read: readValue } });

    return NextResponse.json(
      {
        message: readValue ? 'Notification marked as read' : 'Notification marked as unread',
        modified: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating notifications:', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

// ✅ DELETE: Delete a notification by ID (via query param, with org_id check)
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const userId = (decoded as any).userId || (decoded as any).id;

  // Get org_id from token for organization scoping
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID (_id) is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    
    const orgObjectId = org_id instanceof ObjectId ? org_id : new ObjectId(org_id);
    
    const result = await db
      .collection('notifications')
      .deleteOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
        org_id: orgObjectId // Ensure notification belongs to user's organization
      });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification deleted' }, { status: 200 });
  } catch (err) {
    console.error('Error deleting notification:', err);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
