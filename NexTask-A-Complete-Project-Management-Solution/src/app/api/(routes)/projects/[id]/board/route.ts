import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifyToken } from '../../../../helpers';
import { ObjectId } from 'mongodb';

// GET: Fetch task sections with grouped tasks - single optimized call
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
    const tasksCollection = db.collection('tasks');
    const usersCollection = db.collection('users');

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

    // Fetch sections ordered by order field
    const sections = await sectionsCollection
      .find({ projectId: new ObjectId(projectId) })
      .sort({ order: 1 })
      .toArray();

    // If no sections exist, create default sections
    if (sections.length === 0) {
      const defaultSections = [
        { name: 'To Do', order: 0, isDefault: true },
        { name: 'In Progress', order: 1, isDefault: true },
        { name: 'Completed', order: 2, isDefault: true },
      ];

      const insertResults = await sectionsCollection.insertMany(
        defaultSections.map((s) => ({
          projectId: new ObjectId(projectId),
          ...s,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: decoded.id,
        }))
      );

      // Fetch created sections
      const createdSectionIds = Object.values(insertResults.insertedIds);
      const createdSections = await sectionsCollection
        .find({ _id: { $in: createdSectionIds } })
        .sort({ order: 1 })
        .toArray();

      sections.push(...createdSections);
    }

    // Fetch all tasks for this project in a single query
    const tasks = await tasksCollection
      .find({ projectId: new ObjectId(projectId) })
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    // Get unique assignee IDs from all tasks (handle both array and legacy single assignee)
    const allAssigneeIds = new Set<string>();
    tasks.forEach(task => {
      if (task.assignee) {
        if (Array.isArray(task.assignee)) {
          task.assignee.forEach((id: any) => {
            const idStr = typeof id === 'string' ? id : id.toString();
            if (idStr) allAssigneeIds.add(idStr);
          });
        } else {
          // Handle legacy single assignee format
          const idStr = typeof task.assignee === 'string' ? task.assignee : task.assignee.toString();
          if (idStr) allAssigneeIds.add(idStr);
        }
      }
    });

    // Fetch assignee info in one query
    const assignees = Array.from(allAssigneeIds).length > 0
      ? await usersCollection
        .find({ _id: { $in: Array.from(allAssigneeIds).map(id => new ObjectId(id)) } })
        .toArray()
      : [];

    const assigneeMap = new Map(
      assignees.map(u => [u._id.toString(), {
        _id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        photoUrl: u.photoUrl,
      }])
    );

    // Group tasks by sectionId
    const tasksBySection = new Map();
    tasks.forEach((task) => {
      const sectionId = task.sectionId?.toString() || null;
      if (!tasksBySection.has(sectionId)) {
        tasksBySection.set(sectionId, []);
      }
      
      // Handle assignee array (convert legacy single assignee to array)
      let assigneeIds: string[] = [];
      let assigneeInfo: any[] = [];
      
      if (task.assignee) {
        if (Array.isArray(task.assignee)) {
          assigneeIds = task.assignee.map((id: any) => {
            const idStr = typeof id === 'string' ? id : id.toString();
            return idStr;
          });
        } else {
          // Legacy single assignee format - convert to array
          const idStr = typeof task.assignee === 'string' ? task.assignee : task.assignee.toString();
          assigneeIds = [idStr];
        }
        
        assigneeInfo = assigneeIds
          .map((id: string) => assigneeMap.get(id))
          .filter(Boolean);
      }
      
      tasksBySection.get(sectionId).push({
        _id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status || 'pending', // Include status field
        priority: task.priority || 'Medium',
        dueDate: task.dueDate,
        order: task.order || 0,
        sectionId: sectionId,
        assignee: assigneeIds.length > 0 ? assigneeIds : null,
        assigneeInfo: assigneeInfo.length > 0 ? assigneeInfo : null,
        attachments: task.attachments || [],
        subtasks: task.subtasks || [],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });
    });

    // Build response with sections and their tasks
    const sectionsWithTasks = sections.map((section) => {
      const sectionId = section._id.toString();
      const sectionTasks = tasksBySection.get(sectionId) || [];

      // Sort tasks by order within section
      sectionTasks.sort((a, b) => a.order - b.order);

      return {
        _id: sectionId,
        name: section.name,
        order: section.order,
        isDefault: section.isDefault,
        projectId: section.projectId.toString(),
        tasks: sectionTasks,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      };
    });

    // Handle tasks without sectionId (legacy tasks)
    const orphanTasks = tasksBySection.get(null) || [];
    if (orphanTasks.length > 0 && sections.length > 0) {
      // Assign orphan tasks to first section (To Do)
      sectionsWithTasks[0].tasks.push(...orphanTasks);
      sectionsWithTasks[0].tasks.sort((a, b) => a.order - b.order);
    }

    return NextResponse.json(
      {
        success: true,
        sections: sectionsWithTasks,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching task sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task sections' },
      { status: 500 }
    );
  }
}

