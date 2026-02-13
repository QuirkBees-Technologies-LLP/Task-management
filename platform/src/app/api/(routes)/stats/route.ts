import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, getOrgIdFromToken } from '../../helpers';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token for organization scoping
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    // Get statistics filtered by org_id
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    const tasksCollection = db.collection('tasks');

    const orgObjectId = org_id instanceof ObjectId ? org_id : new ObjectId(org_id);

    const [totalUsers, totalProjects, completedTasks, pendingTasks] = await Promise.all([
      usersCollection.countDocuments({ org_id: orgObjectId }),
      projectsCollection.countDocuments({ org_id: orgObjectId }),
      tasksCollection.countDocuments({ org_id: orgObjectId, status: 'completed' }),
      tasksCollection.countDocuments({ org_id: orgObjectId, status: 'pending' }),
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


