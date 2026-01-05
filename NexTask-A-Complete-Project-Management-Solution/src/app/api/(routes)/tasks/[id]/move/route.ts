import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifyToken } from '../../../../helpers';
import { ObjectId } from 'mongodb';

// PATCH: Move task to a different section or reorder within section
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const taskId = params?.id;
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { sectionId, order, projectId } = body;

    if (sectionId === undefined || order === undefined) {
      return NextResponse.json(
        { error: 'sectionId and order are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');
    const sectionsCollection = db.collection('taskSections');

    // Verify task exists
    const task = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify section exists if provided
    if (sectionId) {
      const section = await sectionsCollection.findOne({
        _id: new ObjectId(sectionId),
      });

      if (!section) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }

      // Verify section belongs to same project
      if (projectId && section.projectId.toString() !== projectId) {
        return NextResponse.json(
          { error: 'Section does not belong to this project' },
          { status: 400 }
        );
      }
    }

    // Update task section and order
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (sectionId) {
      updateData.sectionId = new ObjectId(sectionId);
    } else {
      updateData.sectionId = null;
    }

    updateData.order = order;

    // Update other tasks' orders if needed (shift tasks in the same section)
    if (task.sectionId) {
      const oldSectionId = task.sectionId.toString();
      const newSectionId = sectionId;

      // If moving to different section, update orders in both sections
      if (oldSectionId !== newSectionId) {
        // Decrement orders in old section for tasks after the moved task
        await tasksCollection.updateMany(
          {
            _id: { $ne: new ObjectId(taskId) },
            sectionId: new ObjectId(oldSectionId),
            order: { $gt: task.order || 0 },
          },
          { $inc: { order: -1 } }
        );

        // Increment orders in new section for tasks at or after the new position
        await tasksCollection.updateMany(
          {
            _id: { $ne: new ObjectId(taskId) },
            sectionId: new ObjectId(newSectionId),
            order: { $gte: order },
          },
          { $inc: { order: 1 } }
        );
      } else {
        // Same section, just reordering
        const oldOrder = task.order || 0;
        if (order > oldOrder) {
          // Moving down
          await tasksCollection.updateMany(
            {
              _id: { $ne: new ObjectId(taskId) },
              sectionId: new ObjectId(sectionId),
              order: { $gt: oldOrder, $lte: order },
            },
            { $inc: { order: -1 } }
          );
        } else if (order < oldOrder) {
          // Moving up
          await tasksCollection.updateMany(
            {
              _id: { $ne: new ObjectId(taskId) },
              sectionId: new ObjectId(sectionId),
              order: { $gte: order, $lt: oldOrder },
            },
            { $inc: { order: 1 } }
          );
        }
      }
    }

    await tasksCollection.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: updateData }
    );

    const updatedTask = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
    });

    return NextResponse.json(
      {
        success: true,
        task: {
          ...updatedTask,
          _id: updatedTask?._id.toString(),
          sectionId: updatedTask?.sectionId?.toString(),
          projectId: updatedTask?.projectId.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error moving task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to move task' },
      { status: 500 }
    );
  }
}

