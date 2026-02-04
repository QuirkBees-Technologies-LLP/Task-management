import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifySystemAdmin } from '../../../helpers';

export async function GET(request: Request) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const organizationsCollection = db.collection('organizations');
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    const tasksCollection = db.collection('tasks');

    // Get total counts
    const totalOrganizations = await organizationsCollection.countDocuments({ deletedAt: null });
    const activeOrganizations = await organizationsCollection.countDocuments({ 
      deletedAt: null, 
      status: 'active' 
    });
    const totalUsers = await usersCollection.countDocuments({});
    const totalProjects = await projectsCollection.countDocuments({});
    const totalTasks = await tasksCollection.countDocuments({});

    // Get recent activity
    const recentOrganizations = await organizationsCollection
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json(
      {
        success: true,
        stats: {
          organizations: {
            total: totalOrganizations,
            active: activeOrganizations,
            inactive: totalOrganizations - activeOrganizations,
          },
          users: {
            total: totalUsers,
          },
          projects: {
            total: totalProjects,
          },
          tasks: {
            total: totalTasks,
          },
        },
        recentOrganizations: recentOrganizations.map((org) => ({
          _id: org._id.toString(),
          name: org.name,
          slug: org.slug,
          status: org.status,
          createdAt: org.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}



