import { NextResponse } from 'next/server';
import { ObjectId } from 'bson';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken } from '../../helpers';

export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');
    const userTasks = await db.collection('userTasks').find({
      userId: new ObjectId(decoded.id),
    });

    const tasks: any[] = [];
    for await (const task of userTasks) {
      const taskData = await tasksCollection.findOne({
        _id: task.taskId,
      });
      if (taskData) {
        tasks.push({ ...task, ...taskData });
      }
    }

    tasks.sort((a, b) => a.order - b.order);

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { decoded, error, status: errorStatus } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status: errorStatus });

  const body = await request.json();
  const { status, taskId } = body;

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const userTasksCollection = db.collection('userTasks');

    const result = await userTasksCollection.updateOne(
      { taskId: new ObjectId(taskId), userId: new ObjectId(decoded.id) },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task state updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating task state:', error);
    return NextResponse.json({ error: 'Failed to update task state' }, { status: 500 });
  }
}
