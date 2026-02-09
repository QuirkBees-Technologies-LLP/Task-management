import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, getOrgIdFromToken, userRolesServer } from '../../helpers';
import { createNotification } from '../../lib/notification';

// GET: Fetch support tickets
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const ticketStatus = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const ticketsCollection = db.collection('supportTickets');

    const query: any = {};

    // NOTE: We intentionally do NOT filter strictly by org_id here to ensure
    // older tickets (without org_id) and tickets from users without org info
    // are still visible in the Support UI. Role-based checks still apply below.

    // Regular users only see their own tickets; admins see all tickets.
    if (decoded.role === userRolesServer.regular) {
      query.createdBy = decoded.id;
    }
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (ticketStatus) {
      query.status = ticketStatus;
    }
    if (priority) {
      query.priority = priority;
    }

    const total = await ticketsCollection.countDocuments(query);
    const skip = (page - 1) * limit;

    const tickets = await ticketsCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        tickets: tickets.map((t) => ({
          ...t,
          _id: t._id.toString(),
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
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}

// POST: Create support ticket
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const {
      ticketNumber,
      subject,
      description,
      priority,
      category,
      assignedTo,
      contact,
      attachments,
    } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const ticketsCollection = db.collection('supportTickets');

    // Determine org for scoping (optional but preferred)
    const org_id = getOrgIdFromToken(decoded);

    // Generate ticket number if not provided
    const ticketNum = ticketNumber || `TKT-${Date.now()}`;

    const newTicket: any = {
      ticketNumber: ticketNum,
      subject,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      read: false,
      assignedTo: assignedTo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
      contact: contact || null,
      attachments: Array.isArray(attachments) ? attachments : [],
    };

    if (org_id) {
      newTicket.org_id = org_id;
    }

    const result = await ticketsCollection.insertOne(newTicket);

    // Notify admins that a new support ticket was created
    const usersCollection = db.collection('users');

    let admins = [];
    if (org_id) {
      // Send to organization admins
      admins = await usersCollection
        .find({ org_id, role: userRolesServer.admin })
        .toArray();
    } else {
      // Send to system admins if no organization
      admins = await usersCollection
        .find({ isSystemAdmin: true })
        .toArray();
    }

    if (admins.length > 0) {
      const requesterName =
        (contact?.firstName || '') + ' ' + (contact?.lastName || '') ||
        decoded.email ||
        'A user';

      const message = `${requesterName.trim()} submitted a new support ticket "${subject}"`;

      for (const admin of admins) {
        try {
          await createNotification({
            userId: admin._id,
            message,
            type: 'info',
            org_id: org_id || undefined, // Only set org_id if it exists
          });
        } catch (err) {
          console.error('Error creating support ticket notification for admin:', err);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        ticket: { ...newTicket, _id: result.insertedId.toString() },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
  }
}

// PATCH: Update support ticket
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { ticketId, subject, description, priority, status: ticketStatus, category, assignedTo, read } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const ticketsCollection = db.collection('supportTickets');

    // Verify ticket exists
    const existingTicket = await ticketsCollection.findOne({ 
      _id: new ObjectId(ticketId)
    });
    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (subject) updateData.subject = subject;
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (ticketStatus) updateData.status = ticketStatus;
    if (category) updateData.category = category;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (read !== undefined) updateData.read = read;

    const result = await ticketsCollection.updateOne(
      { _id: new ObjectId(ticketId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Ticket updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({ error: 'Failed to update support ticket' }, { status: 500 });
  }
}

// DELETE: Delete support ticket
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('_id');

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const ticketsCollection = db.collection('supportTickets');

    // Verify ticket exists
    const existingTicket = await ticketsCollection.findOne({ 
      _id: new ObjectId(ticketId)
    });
    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const result = await ticketsCollection.deleteOne({ 
      _id: new ObjectId(ticketId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json({ error: 'Failed to delete support ticket' }, { status: 500 });
  }
}

