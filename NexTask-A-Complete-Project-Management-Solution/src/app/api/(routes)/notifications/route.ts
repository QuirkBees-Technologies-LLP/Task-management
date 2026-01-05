import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { ObjectId } from 'mongodb';
import { verifyToken, getOrgIdFromToken } from '../../helpers';

// ✅ GET: Fetch notifications for a user
export async function GET(request: NextRequest) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  // Get org_id from token
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 403 }
    );
  }

  const userId = (decoded as any).id;

  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const query = db
      .collection('notifications')
      .find({
        userId: new ObjectId(userId),
        org_id: org_id // Filter by org_id
      })
      .sort({ createdAt: -1 });

    const notifications = limit ? await query.limit(limit).toArray() : await query.toArray();

    return NextResponse.json(notifications, { status: 200 });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// ✅ POST: Create a notification
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  // Get org_id from token
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 403 }
    );
  }

  const userId = (decoded as any).userId || (decoded as any).id;

  try {
    const body = await request.json();
    const { message, type = 'info' } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const notification = {
      userId,
      message,
      type,
      read: false,
      org_id: org_id, // Add org_id
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

// ✅ PUT: Mark one or more notifications as read
export async function PUT(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  // Get org_id from token
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 403 }
    );
  }

  const userId = (decoded as any).id;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const result = await db
      .collection('notifications')
      .updateOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
        org_id: org_id // Verify org_id match
      }, { $set: { read: true } });

    return NextResponse.json(
      {
        message: 'Notifications marked as read',
        modified: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating notifications:', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

// ✅ DELETE: Delete a notification by ID (via query param)
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  // Get org_id from token
  const org_id = getOrgIdFromToken(decoded);
  if (!org_id) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 403 }
    );
  }

  const userId = (decoded as any).userId || (decoded as any).id;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID (_id) is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const result = await db
      .collection('notifications')
      .deleteOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
        org_id: org_id // Verify org_id match
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
