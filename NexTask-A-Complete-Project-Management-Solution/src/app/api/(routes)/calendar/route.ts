import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken } from '../../helpers';

// GET: Fetch calendar events and tasks
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || '';
    const includeTasks = searchParams.get('includeTasks') === 'true';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const allEvents: any[] = [];

    // Fetch calendar events
    const eventsCollection = db.collection('calendarEvents');
    const query: any = {};
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    if (type) {
      query.type = type;
    }

    const events = await eventsCollection
      .find(query)
      .sort({ startDate: 1 })
      .toArray();

    events.forEach((e) => {
      allEvents.push({
        ...e,
        _id: e._id.toString(),
        eventType: 'calendar',
      });
    });

    // Fetch tasks with due dates if requested
    if (includeTasks) {
      const tasksCollection = db.collection('tasks');
      const taskQuery: any = {
        dueDate: { $exists: true, $ne: null }
      };

      if (startDate || endDate) {
        taskQuery.dueDate = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          taskQuery.dueDate.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          taskQuery.dueDate.$lte = end;
        }
      }

      const tasks = await tasksCollection
        .find(taskQuery)
        .sort({ dueDate: 1 })
        .toArray();

      // Convert tasks to calendar events
      tasks.forEach((task) => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          allEvents.push({
            _id: task._id.toString(),
            title: task.title,
            description: task.description || '',
            startDate: dueDate,
            endDate: dueDate,
            allDay: true,
            eventType: 'task',
            taskId: task._id.toString(),
            projectId: task.projectId?.toString() || '',
            status: task.status || '',
            priority: task.priority || '',
            assignee: task.assignee?.toString() || '',
          });
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        events: allEvents,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

// POST: Create calendar event
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { title, description, startDate, endDate, type, location, attendees } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const eventsCollection = db.collection('calendarEvents');

    const newEvent = {
      title,
      description: description || '',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      type: type || 'meeting',
      location: location || '',
      attendees: attendees || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
    };

    const result = await eventsCollection.insertOne(newEvent);

    return NextResponse.json(
      {
        success: true,
        event: { ...newEvent, _id: result.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}

// PATCH: Update calendar event
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { eventId, title, description, startDate, endDate, type, location, attendees } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const eventsCollection = db.collection('calendarEvents');

    // Verify event exists
    const existingEvent = await eventsCollection.findOne({
      _id: new ObjectId(eventId)
    });
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = endDate ? new Date(endDate) : null;
    if (type) updateData.type = type;
    if (location !== undefined) updateData.location = location;
    if (attendees) updateData.attendees = attendees;

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Event updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: 'Failed to update calendar event' }, { status: 500 });
  }
}

// DELETE: Delete calendar event
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('_id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const eventsCollection = db.collection('calendarEvents');

    // Verify event exists
    const existingEvent = await eventsCollection.findOne({
      _id: new ObjectId(eventId)
    });
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const result = await eventsCollection.deleteOne({
      _id: new ObjectId(eventId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Event deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 });
  }
}

