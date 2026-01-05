import { NextResponse } from 'next/server';
import { verifyToken } from '../../helpers';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const { id } = decoded;

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const userCollection = db.collection('users');

    const userTasks = await db
      .collection('userTasks')
      .find({
        userId: new ObjectId(id),
      })
      .toArray();

    const totalTasks = userTasks.length;
    const totalUsers = await userCollection.countDocuments({});

    const inProgressTasks = userTasks.filter((item) => item.status === 'in_progress').length;
    const completedTasks = await userTasks.filter((item) => item.status === 'completed').length;
    const pendingTasks = await userTasks.filter((item) => item.status === 'todo').length;
    const overdueTasks = await userTasks.filter((item) => {
      if (item.dueDate) {
        return item.dueDate < new Date();
      }
      return false;
    }).length;

    const data = {
      analytics: {
        tasks: totalTasks,
        users: totalUsers,
        completedTasks: completedTasks,
      },
      tasks: {
        inProgress: inProgressTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
      },
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 });
  }
}
