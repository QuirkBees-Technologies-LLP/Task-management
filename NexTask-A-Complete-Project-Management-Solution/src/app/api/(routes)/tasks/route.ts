import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { ObjectId } from 'mongodb';
import { userRolesServer, verifyToken } from '../../helpers';
import { addTaskForAllUsers, deleteTaskForAllUsers } from '../../lib/taskController';

// POST: Add a new task
export async function POST(request: Request) {
  const { error, status } = await verifyToken(request, userRolesServer.admin, true);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();

    const { title, description, dueDate, priority } = body;
    if (!title || !description || !dueDate || !priority) {
      return NextResponse.json(
        {
          error: 'All fields (title, description, dueDate, priority) are required',
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');
    const count = await tasksCollection.countDocuments();

    const result = await tasksCollection.insertOne({
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: count + 1,
    });

    await addTaskForAllUsers(result);

    return NextResponse.json(
      { message: 'Task created successfully', id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PUT: Update an existing task
export async function PUT(request: Request) {
  const { error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();

    const { _id, title, description, dueDate, priority } = body;
    if (!_id || !title || !description || !dueDate || !priority) {
      return NextResponse.json(
        {
          error: 'All fields (id, title, description, dueDate, priority) are required',
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          title,
          description,
          dueDate: new Date(dueDate),
          priority,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// GET: Retrieve all tasks
export async function GET(request: Request) {
  const { error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    const tasks = await tasksCollection.find({}).sort({ order: 1 }).toArray();

    for (const task of tasks) {
      const status = await db.collection('userTasks').findOne({ taskId: task._id });
      if (status) {
        tasks[tasks.indexOf(task)].status = status.status;
      }
    }

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// DELETE: Remove a task by ID
export async function DELETE(request: Request) {
  const { error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID (_id) is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await deleteTaskForAllUsers(id);

    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

// PATCH: Update task order
export async function PATCH(request: Request) {
  const { error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { orderedTasks } = body; // array of { _id, order }

    if (!orderedTasks || !Array.isArray(orderedTasks)) {
      return NextResponse.json({ error: 'orderedTasks array is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    const bulkOps = orderedTasks.map((task) => ({
      updateOne: {
        filter: { _id: new ObjectId(task._id) },
        update: { $set: { order: task.order, updatedAt: new Date() } },
      },
    }));

    if (bulkOps.length > 0) {
      await tasksCollection.bulkWrite(bulkOps);
    }

    return NextResponse.json({ message: 'Task order updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating task order:', error);
    return NextResponse.json({ error: 'Failed to update task order' }, { status: 500 });
  }
}
