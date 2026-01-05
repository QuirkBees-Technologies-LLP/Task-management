import { NextResponse } from 'next/server';
import clientPromise from '@/app/api/lib/mongodb';
import { DATABASE_NAME } from '@/app/api/config';
import { verifyToken } from '@/app/api/helpers';
import { ObjectId } from 'mongodb';

/**
 * GET: Fetch all tasks (used for list / fallback)
 */
export async function GET(request: Request) {
  const { error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000', 10);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    const tasks = await tasksCollection
      .find({})
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Map tasks with assignee support
    const mappedTasks = tasks.map((task) => {
      const taskData: any = {
        _id: task._id.toString(),
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'Medium',
        projectId: task.projectId?.toString() || '',
        sectionId: task.sectionId?.toString() || null,
        dueDate: task.dueDate || null,
        createdAt: task.createdAt || new Date(),
        updatedAt: task.updatedAt || task.createdAt || new Date(),
      };
      
      // Handle assignee array (convert legacy single assignee to array)
      if (task.assignee) {
        if (Array.isArray(task.assignee)) {
          taskData.assignee = task.assignee.map((id: any) => String(id));
        } else {
          // Legacy single assignee format - convert to array
          taskData.assignee = [String(task.assignee)];
        }
      } else {
        taskData.assignee = [];
      }
      
      return taskData;
    });

    return NextResponse.json(
      {
        success: true,
        tasks: mappedTasks,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error fetching tasks:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create task in a SPECIFIC SECTION  ✅ FIX
 */
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const {
      title,
      description = '',
      projectId,
      sectionId,
      priority = 'Medium',
      dueDate = null,
    } = body;

    if (!title || !projectId || !sectionId) {
      return NextResponse.json(
        { error: 'title, projectId and sectionId are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    // Get next order inside the SAME section
    const lastTask = await tasksCollection
      .find({ sectionId: new ObjectId(sectionId) })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const order = lastTask.length ? (lastTask[0].order || 0) + 1 : 0;

    const newTask = {
      title,
      description,
      projectId: new ObjectId(projectId),
      sectionId: new ObjectId(sectionId), // 🔴 THIS WAS MISSING BEFORE
      priority,
      dueDate,
      order,
      createdBy: decoded.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tasksCollection.insertOne(newTask);

    return NextResponse.json(
      {
        success: true,
        task: {
          ...newTask,
          _id: result.insertedId.toString(),
          projectId,
          sectionId,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating task:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
