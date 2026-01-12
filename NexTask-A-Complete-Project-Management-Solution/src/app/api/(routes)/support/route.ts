import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken } from '../../helpers';

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
    const { ticketNumber, subject, description, priority, category, assignedTo } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const ticketsCollection = db.collection('supportTickets');

    // Generate ticket number if not provided
    const ticketNum = ticketNumber || `TKT-${Date.now()}`;

    const newTicket = {
      ticketNumber: ticketNum,
      subject,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      assignedTo: assignedTo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
    };

    const result = await ticketsCollection.insertOne(newTicket);

    return NextResponse.json(
      {
        success: true,
        ticket: { ...newTicket, _id: result.insertedId.toString() },
      },
      { status: 201 }
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
    const { ticketId, subject, description, priority, status: ticketStatus, category, assignedTo } = body;

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

