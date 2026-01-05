import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifyToken, userRolesServer } from '../../../helpers';
import { ObjectId } from 'mongodb';

// PATCH: Update section (rename or reorder)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const sectionId = params?.id;
    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, order } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const sectionsCollection = db.collection('taskSections');

    const existingSection = await sectionsCollection.findOne({
      _id: new ObjectId(sectionId),
    });

    if (!existingSection) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Allow admins to rename any section, including default sections
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    await sectionsCollection.updateOne(
      { _id: new ObjectId(sectionId) },
      { $set: updateData }
    );

    const updatedSection = await sectionsCollection.findOne({
      _id: new ObjectId(sectionId),
    });

    return NextResponse.json(
      {
        success: true,
        section: {
          ...updatedSection,
          _id: updatedSection?._id.toString(),
          projectId: updatedSection?.projectId.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a section
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const sectionId = params?.id;
    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const sectionsCollection = db.collection('taskSections');
    const tasksCollection = db.collection('tasks');

    const section = await sectionsCollection.findOne({
      _id: new ObjectId(sectionId),
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Prevent deleting default sections
    if (section.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default sections' },
        { status: 400 }
      );
    }

    // Check if section has tasks
    const taskCount = await tasksCollection.countDocuments({
      sectionId: new ObjectId(sectionId),
    });

    if (taskCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete section with ${taskCount} task(s). Please move tasks first.` },
        { status: 400 }
      );
    }

    await sectionsCollection.deleteOne({
      _id: new ObjectId(sectionId),
    });

    return NextResponse.json(
      { success: true, message: 'Section deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}

