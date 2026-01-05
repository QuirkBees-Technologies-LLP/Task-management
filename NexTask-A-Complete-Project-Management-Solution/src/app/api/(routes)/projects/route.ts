import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, userRolesServer } from '../../helpers';

export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');

    // Build query for search
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: any = {};
    if (sortBy === 'dueDate') {
      sort.dueDate = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'status') {
      sort.status = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Get total count for pagination
    const total = await projectsCollection.countDocuments(query);

    // Get paginated projects
    const skip = (page - 1) * limit;
    const projects = await projectsCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json(
      {
        success: true,
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { name, clientName, description, dueDate, status: projectStatus } = body;

    // Validation
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');

    // Check if project with same name already exists
    const existingProject = await projectsCollection.findOne({ name });
    if (existingProject) {
      return NextResponse.json(
        { error: 'Project with this name already exists' },
        { status: 400 }
      );
    }

    // Create the project
    const newProject = {
      name,
      clientName: clientName || '',
      description,
      status: projectStatus || 'Pending',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
    };

    const result = await projectsCollection.insertOne(newProject);

    return NextResponse.json(
      { success: true, project: { ...newProject, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
  }
}
