import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifyToken, userRolesServer } from '../../../../helpers';
import { ObjectId } from 'mongodb';

// GET: Fetch all sections for a project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const projectId = params?.id;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');
    const sectionsCollection = db.collection('taskSections');

    // Verify project exists
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // For regular users only, enforce assignee-based access
    if (decoded.role !== 'Admin') {
      const userId = decoded.id || decoded.user_id;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 403 });
      }
      const userObjectId = new ObjectId(userId);

      if (!project.assignee || !Array.isArray(project.assignee) || project.assignee.length === 0) {
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this project.' },
          { status: 403 }
        );
      }

      const isAssigned = project.assignee.some((assigneeId: any) => {
        const assigneeObjectId = assigneeId instanceof ObjectId ? assigneeId : new ObjectId(assigneeId);
        return assigneeObjectId.equals(userObjectId);
      });

      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this project.' },
          { status: 403 }
        );
      }
    }

    const sections = await sectionsCollection
      .find({ projectId: new ObjectId(projectId) })
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        sections: sections.map((s) => ({
          ...s,
          _id: s._id.toString(),
          projectId: s.projectId.toString(),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST: Create a new section
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const projectId = params?.id;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Section name is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const sectionsCollection = db.collection('taskSections');
    const projectsCollection = db.collection('projects');

    // Verify project exists
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // For regular users only, enforce assignee-based access
    if (decoded.role !== 'Admin') {
      const userId = decoded.id || decoded.user_id;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 403 });
      }
      const userObjectId = new ObjectId(userId);

      if (!project.assignee || !Array.isArray(project.assignee) || project.assignee.length === 0) {
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this project.' },
          { status: 403 }
        );
      }

      const isAssigned = project.assignee.some((assigneeId: any) => {
        const assigneeObjectId = assigneeId instanceof ObjectId ? assigneeId : new ObjectId(assigneeId);
        return assigneeObjectId.equals(userObjectId);
      });

      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this project.' },
          { status: 403 }
        );
      }
    }

    // Get the highest order number
    const lastSection = await sectionsCollection
      .findOne(
        { projectId: new ObjectId(projectId) },
        { sort: { order: -1 } }
      );

    const newOrder = lastSection ? lastSection.order + 1 : 0;

    const newSection = {
      projectId: new ObjectId(projectId),
      name: name.trim(),
      order: newOrder,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
    };

    const result = await sectionsCollection.insertOne(newSection);

    return NextResponse.json(
      {
        success: true,
        section: {
          ...newSection,
          _id: result.insertedId.toString(),
          projectId: projectId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create section' },
      { status: 500 }
    );
  }
}



