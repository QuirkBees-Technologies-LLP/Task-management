import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { ObjectId } from 'mongodb';
import { userRolesServer, verifyToken, requireOrgIdFromToken, getOrgIdFromToken } from '../../helpers';
import { addTaskForAllUsers, deleteTaskForAllUsers } from '../../lib/taskController';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../lib/orgIdHelper';

// POST: Add a new task
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin, true);
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

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');
    const count = await tasksCollection.countDocuments(addOrgIdToQuery({}, org_id));

    const newTask = addOrgIdToDocument({
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: count + 1,
    }, org_id);

    const result = await tasksCollection.insertOne(newTask);

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
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
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

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    const result = await tasksCollection.updateOne(
      addOrgIdToQuery({ _id: new ObjectId(_id) }, org_id),
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
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const projectId = searchParams.get('projectId');

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    // Build query for search with org_id filter and optional project filter
    const baseQuery: any = addOrgIdToQuery({}, org_id);
    const query: any = { ...baseQuery };

    if (projectId) {
      try {
        query.projectId = new ObjectId(projectId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
      }
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: any = {};
    if (sortBy === 'dueDate') {
      sort.dueDate = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'status') {
      sort.status = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Get total count for pagination
    const total = await tasksCollection.countDocuments(query);

    // Get paginated tasks
    const skip = (page - 1) * limit;
    const tasks = await tasksCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Populate status from userTasks if needed
    for (const task of tasks) {
      const userTaskStatus = await db.collection('userTasks').findOne({ taskId: task._id });
      if (userTaskStatus && !task.status) {
        tasks[tasks.indexOf(task)].status = userTaskStatus.status;
      }
    }

    return NextResponse.json(
      {
        success: true,
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// DELETE: Remove a task by ID
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID (_id) is required' }, { status: 400 });
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    const result = await tasksCollection.deleteOne(
      addOrgIdToQuery({ _id: new ObjectId(id) }, org_id)
    );

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
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { orderedTasks } = body; // array of { _id, order }

    if (!orderedTasks || !Array.isArray(orderedTasks)) {
      return NextResponse.json({ error: 'orderedTasks array is required' }, { status: 400 });
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    const bulkOps = orderedTasks.map((task) => ({
      updateOne: {
        filter: addOrgIdToQuery({ _id: new ObjectId(task._id) }, org_id),
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
