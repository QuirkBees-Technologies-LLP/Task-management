import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifySystemAdmin } from '../../../../helpers';

// DELETE: Clear all tasks from the database
// System admin only endpoint
export async function DELETE(request: Request) {
  // Verify user is system admin
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');
    const userTasksCollection = db.collection('userTasks');

    // Delete all tasks
    const tasksResult = await tasksCollection.deleteMany({});

    // Also delete all user task assignments
    const userTasksResult = await userTasksCollection.deleteMany({});

    return NextResponse.json(
      {
        success: true,
        message: 'All tasks cleared successfully',
        deletedTasks: tasksResult.deletedCount,
        deletedUserTasks: userTasksResult.deletedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error clearing tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to clear tasks';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}


