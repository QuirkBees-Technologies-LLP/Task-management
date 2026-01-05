import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken } from '../../helpers';

export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    // Get statistics
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    const tasksCollection = db.collection('tasks');

    const [totalUsers, totalProjects, completedTasks, pendingTasks] = await Promise.all([
      usersCollection.countDocuments({}),
      projectsCollection.countDocuments({}),
      tasksCollection.countDocuments({ status: 'completed' }),
      tasksCollection.countDocuments({ status: 'pending' }),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers,
          totalProjects,
          completedTasks,
          pendingTasks,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch statistics' }, { status: 500 });
  }
}


