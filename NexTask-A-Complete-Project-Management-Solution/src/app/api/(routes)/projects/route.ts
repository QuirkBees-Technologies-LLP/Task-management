import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, userRolesServer, requireOrgIdFromToken, getOrgIdFromToken } from '../../helpers';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../lib/orgIdHelper';
import { ObjectId } from 'mongodb';
import { createNotification } from '../../lib/notification';

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

    // Get org_id from token for organization scoping
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');

    // Build query for search with org_id filter
    const query: any = addOrgIdToQuery({}, org_id);

    // For Regular users, only show projects they are assigned to.
    // Admins and system-level users can see all projects in the org.
    if (decoded.role === userRolesServer.regular) {
      const userId = decoded.id || decoded.user_id;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 403 });
      }
      const userObjectId = new ObjectId(userId);
      query.assignee = userObjectId;
    }
    
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
    const { name, clientName, description, dueDate, status: projectStatus, assignee, attachments, priority } = body;

    // Validation
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');

    // Check if project with same name already exists in the organization
    const existingProject = await projectsCollection.findOne(
      addOrgIdToQuery({ name }, org_id)
    );
    if (existingProject) {
      return NextResponse.json(
        { error: 'Project with this name already exists' },
        { status: 400 }
      );
    }

    // Validate and map assignee IDs (same pattern as tasks API)
    // Projects MUST have at least one assignee - projects are only visible to assigned users
    const assigneeIds: ObjectId[] = [];
    const creatorId = new ObjectId(decoded.id || decoded.user_id);

    if (assignee && Array.isArray(assignee) && assignee.length > 0) {
      try {
        const usersCollection = db.collection('users');

        for (const assigneeIdStr of assignee) {
          if (!assigneeIdStr || typeof assigneeIdStr !== 'string' || assigneeIdStr.trim() === '') continue;

          if (!ObjectId.isValid(assigneeIdStr)) {
            return NextResponse.json({ error: `Invalid assignee ID format: ${assigneeIdStr}` }, { status: 400 });
          }

          const assigneeUser = await usersCollection.findOne({
            _id: new ObjectId(assigneeIdStr),
          });

          if (!assigneeUser) {
            return NextResponse.json({ error: `Assignee user not found: ${assigneeIdStr}` }, { status: 404 });
          }

          assigneeIds.push(new ObjectId(assigneeIdStr));
        }
      } catch (error) {
        console.error('Error validating project assignees:', error);
        return NextResponse.json({ error: 'Invalid assignee ID format' }, { status: 400 });
      }
    }

    // If no assignees provided, automatically add the creator as an assignee
    // This ensures the project creator can always see and access their project
    if (assigneeIds.length === 0) {
      assigneeIds.push(creatorId);
    } else {
      // Ensure creator is always in the assignee list (even if not explicitly added)
      const creatorAlreadyAssigned = assigneeIds.some(id => id.equals(creatorId));
      if (!creatorAlreadyAssigned) {
        assigneeIds.push(creatorId);
      }
    }

    // Create the project with org_id
    const newProject = addOrgIdToDocument({
      name,
      clientName: clientName || '',
      description,
      status: projectStatus || 'Pending',
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'High',
      assignee: assigneeIds,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id || decoded.user_id,
    }, org_id);

    const result = await projectsCollection.insertOne(newProject);

    // Send notifications to assigned users (excluding the creator/admin)
    if (assigneeIds.length > 0) {
      const usersCollection = db.collection('users');
      
      // Get admin info for notification message
      const admin = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
      const adminName = admin
        ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email
        : 'Admin';

      // Send notifications to assigned users (excluding the creator)
      for (const assigneeId of assigneeIds) {
        try {
          // Don't notify if admin assigned themselves
          if (assigneeId.equals(creatorId)) continue;

          await createNotification({
            userId: assigneeId,
            message: `${adminName} has assigned you to project "${name}"`,
            type: 'info',
            org_id: org_id || undefined,
          });
        } catch (error) {
          console.error(`Error creating notification for user ${assigneeId}:`, error);
          // Continue with other notifications even if one fails
        }
      }
    }

    return NextResponse.json(
      { success: true, project: { ...newProject, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
  }
}
