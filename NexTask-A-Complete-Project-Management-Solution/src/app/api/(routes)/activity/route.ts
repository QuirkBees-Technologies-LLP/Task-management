import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, getOrgIdFromToken } from '../../helpers';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');
    const tasksCollection = db.collection('tasks');

    // Get last 5 updated tasks filtered by org_id
    const recentTasks = await tasksCollection
      .find({ org_id: org_id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    // Get last 5 created projects filtered by org_id
    const recentProjects = await projectsCollection
      .find({ org_id: org_id })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Populate assignee info for tasks (filter users by org_id)
    const usersCollection = db.collection('users');
    const tasksWithAssignees = await Promise.all(
      recentTasks.map(async (task) => {
        let assigneeInfo = null;
        if (task.assignee) {
          const user = await usersCollection.findOne({
            _id: task.assignee,
            org_id: org_id // Ensure assignee belongs to same org
          });
          if (user) {
            assigneeInfo = {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            };
          }
        }
        return {
          ...task,
          assigneeInfo,
          type: 'task',
        };
      })
    );

    // Format projects
    const projectsFormatted = recentProjects.map((project) => ({
      ...project,
      type: 'project',
    }));

    // Combine and sort by timestamp (most recent first)
    const combinedActivity = [...tasksWithAssignees, ...projectsFormatted]
      .sort((a, b) => {
        const dateA = (a as any).updatedAt || (a as any).createdAt;
        const dateB = (b as any).updatedAt || (b as any).createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 10); // Get top 10 most recent

    return NextResponse.json(
      {
        success: true,
        activity: combinedActivity,
        recentTasks: tasksWithAssignees,
        recentProjects: projectsFormatted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity' }, { status: 500 });
  }
}


