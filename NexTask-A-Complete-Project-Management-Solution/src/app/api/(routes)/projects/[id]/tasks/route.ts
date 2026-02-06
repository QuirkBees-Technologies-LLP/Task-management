import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifyToken, getOrgIdFromToken } from '../../../../helpers';
import { ObjectId } from 'mongodb';
import { TASK_STATUSES } from '../../../../config/task-statuses/constants';
import { createNotification } from '../../../../lib/notification';
import { extractMentionsFromHTML } from '../../../../lib/mentionHelper';

// GET: Fetch all tasks for a specific project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Extract project ID from params or URL path
    let projectId = params?.id;
    if (!projectId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const projectIndex = pathParts.findIndex((part) => part === 'projects');
      if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
        projectId = pathParts[projectIndex + 1];
      }
    }

    if (!projectId) {
      console.error('Project ID not found in URL:', request.url);
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');
    
    // Verify project exists
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // For regular users only, enforce assignee-based access to project tasks
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const tasksCollection = db.collection('tasks');

    // Build query for search and project filter
    const query: any = { projectId: new ObjectId(projectId) };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: any = {};
    if (sortBy === 'status') {
      sort.status = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'title') {
      sort.title = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Get total count for pagination
    const total = await tasksCollection.countDocuments(query);

    // Get paginated tasks
    const skip = (page - 1) * limit;
    const tasks = await tasksCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Populate assignee information
    const usersCollection = db.collection('users');
    
    // Get all unique assignee IDs from all tasks
    const allAssigneeIds = new Set<ObjectId>();
    tasks.forEach(task => {
      if (task.assignee) {
        if (Array.isArray(task.assignee)) {
          task.assignee.forEach((id: any) => allAssigneeIds.add(typeof id === 'string' ? new ObjectId(id) : id));
        } else {
          // Handle legacy single assignee format
          allAssigneeIds.add(typeof task.assignee === 'string' ? new ObjectId(task.assignee) : task.assignee);
        }
      }
    });
    
    // Fetch all assignees in one query
    const assignees = Array.from(allAssigneeIds).length > 0
      ? await usersCollection.find({ _id: { $in: Array.from(allAssigneeIds) } }).toArray()
      : [];
    
    const assigneeMap = new Map(
      assignees.map(u => [u._id.toString(), {
        _id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
      }])
    );
    
    const populatedTasks = tasks.map((task) => {
      const taskData: any = {
        ...task,
        _id: task._id.toString(),
        projectId: task.projectId.toString(),
      };
      
      // Handle assignee array (convert legacy single assignee to array)
      if (task.assignee) {
        if (Array.isArray(task.assignee)) {
          taskData.assignee = task.assignee.map((id: any) => {
            const idStr = typeof id === 'string' ? id : id.toString();
            return idStr;
          });
        } else {
          // Legacy single assignee format - convert to array
          const assigneeIdStr = typeof task.assignee === 'string' ? task.assignee : task.assignee.toString();
          taskData.assignee = [assigneeIdStr];
        }
        taskData.assigneeInfo = taskData.assignee
          .map((id: string) => assigneeMap.get(id))
          .filter(Boolean);
      } else {
        taskData.assignee = [];
        taskData.assigneeInfo = [];
      }
      
      return taskData;
    });

    return NextResponse.json(
      {
        success: true,
        tasks: populatedTasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching project tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Create a new task for a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Extract project ID from params or URL path
    let projectId = params?.id;
    if (!projectId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const projectIndex = pathParts.findIndex((part) => part === 'projects');
      if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
        projectId = pathParts[projectIndex + 1];
      }
    }

    if (!projectId) {
      console.error('Project ID not found in POST URL:', request.url);
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get current user ID for access checks (regular users only)
    const userId = decoded.id || decoded.user_id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 403 });
    }
    const userObjectId = new ObjectId(userId);

    const body = await request.json();
    const { title, description, assignee, status: taskStatus, priority, dueDate, attachments, subtasks, sectionId } = body;

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate project exists
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');
    const sectionsCollection = db.collection('taskSections');

    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // For regular users only, enforce assignee-based access
    if (decoded.role !== 'Admin') {
      // Check if user is assigned to this project - projects are only accessible to assigned users
      if (!project.assignee || !Array.isArray(project.assignee) || project.assignee.length === 0) {
        // Project has no assignees - deny access
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this project.' },
          { status: 403 }
        );
      }

      // Check if user's ObjectId is in the assignee array
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

    // Validate section if provided
    let sectionObjectId = null;
    if (sectionId) {
      try {
        const section = await sectionsCollection.findOne({
          _id: new ObjectId(sectionId),
          projectId: new ObjectId(projectId),
        });
        if (!section) {
          return NextResponse.json({ error: 'Section not found or does not belong to this project' }, { status: 404 });
        }
        sectionObjectId = new ObjectId(sectionId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid section ID format' }, { status: 400 });
      }
    } else {
      // If no sectionId provided, assign to first section (To Do)
      const firstSection = await sectionsCollection.findOne(
        { projectId: new ObjectId(projectId) },
        { sort: { order: 1 } }
      );
      if (firstSection) {
        sectionObjectId = firstSection._id;
      }
    }

    // Validate assignee if provided (array of user IDs)
    const assigneeIds: ObjectId[] = [];
    
    if (assignee && Array.isArray(assignee) && assignee.length > 0) {
      try {
        const usersCollection = db.collection('users');
        // Validate all assignee IDs exist
        for (const assigneeIdStr of assignee) {
          if (!assigneeIdStr || assigneeIdStr.trim() === '') continue;
          
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
        return NextResponse.json({ error: 'Invalid assignee ID format' }, { status: 400 });
      }
    }

    const tasksCollection = db.collection('tasks');

    // Get the highest order number in the section
    const lastTask = await tasksCollection.findOne(
      { sectionId: sectionObjectId },
      { sort: { order: -1 } }
    );
    const newOrder = lastTask ? (lastTask.order || 0) + 1 : 0;

    // Create task with sectionId instead of hardcoded status
    const validStatusValues = TASK_STATUSES.map((s) => s.value);
    const initialStatus = taskStatus && validStatusValues.includes(taskStatus)
      ? taskStatus
      : TASK_STATUSES[0].value;
    const newTask: any = {
      title,
      description,
      projectId: new ObjectId(projectId),
      assignee: assigneeIds, // Array of user IDs
      sectionId: sectionObjectId,
      order: newOrder,
      status: initialStatus, // Keep for backward compatibility
      statusHistory: [
        {
          status: initialStatus,
          timestamp: new Date(),
          changedBy: decoded.id,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
    };

    if (priority) newTask.priority = priority;
    if (dueDate) newTask.dueDate = new Date(dueDate);
    if (attachments) newTask.attachments = attachments;
    if (subtasks) newTask.subtasks = subtasks;

    const result = await tasksCollection.insertOne(newTask);

    // Send notifications to assigned users (only if admin is creating and assigning)
    if (assigneeIds.length > 0 && decoded.role === 'Admin') {
      const org_id = getOrgIdFromToken(decoded);
      const usersCollection = db.collection('users');
      
      // Get admin info for notification message
      const admin = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
      const adminName = admin
        ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email
        : 'Admin';

      const projectName = project.name || 'a project';

      // Send notifications to assigned users
      for (const assigneeId of assigneeIds) {
        try {
          // Don't notify if admin assigned themselves
          if (assigneeId.toString() === decoded.id) continue;

          await createNotification({
            userId: assigneeId,
            message: `${adminName} has assigned you to task "${title}" in project "${projectName}"`,
            type: 'info',
            org_id: org_id || undefined,
          });
        } catch (error) {
          console.error(`Error creating notification for user ${assigneeId}:`, error);
          // Continue with other notifications even if one fails
        }
      }
    }

    // Extract mentions from description and send notifications
    if (description) {
      const mentionedUserIds = extractMentionsFromHTML(description);

      if (mentionedUserIds.length > 0) {
        const usersCollection = db.collection('users');

        // Get org_id from token for notification scoping
        const org_id = getOrgIdFromToken(decoded);

        // Get task creator info for notification message
        const creator = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
        const creatorName = creator
          ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.email
          : 'Someone';

        // Send notifications to mentioned users
        for (const mentionedUserId of mentionedUserIds) {
          try {
            // Validate ObjectId format
            if (!ObjectId.isValid(mentionedUserId)) {
              console.warn(`Invalid mention user ID format: ${mentionedUserId}`);
              continue;
            }

            // Don't notify the creator if they mentioned themselves
            if (mentionedUserId === decoded.id) continue;

            // Verify user exists
            const mentionedUser = await usersCollection.findOne({ _id: new ObjectId(mentionedUserId) });
            if (!mentionedUser) {
              console.warn(`Mentioned user not found: ${mentionedUserId}`);
              continue;
            }

            await createNotification({
              userId: new ObjectId(mentionedUserId),
              message: `${creatorName} mentioned you in task "${title}"`,
              type: 'info',
              org_id: org_id || undefined, // Include org_id if available
            });
          } catch (error) {
            console.error(`Error creating notification for user ${mentionedUserId}:`, error);
            // Continue with other notifications even if one fails
          }
        }
      }
    }

    // Populate assignee info if exists
    let assigneeInfo: any[] = [];
    if (assigneeIds.length > 0) {
      const usersCollection = db.collection('users');
      const assigneeUsers = await usersCollection.find({
        _id: { $in: assigneeIds },
      }).toArray();
      
      assigneeInfo = assigneeUsers.map(user => ({
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }));
    }

    return NextResponse.json(
      {
        success: true,
        task: {
          ...newTask,
          _id: result.insertedId.toString(),
          projectId: projectId,
          assignee: assigneeIds.map(id => id.toString()),
          assigneeInfo
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
    // If it's an ObjectId error, provide more helpful message
    if (errorMessage.includes('ObjectId') || errorMessage.includes('BSON')) {
      return NextResponse.json(
        { success: false, error: 'Invalid project or assignee ID format' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH: Update a task (including status changes with history)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Extract project ID from params or URL path
    let projectId = params?.id;
    if (!projectId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const projectIndex = pathParts.findIndex((part) => part === 'projects');
      if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
        projectId = pathParts[projectIndex + 1];
      }
    }

    if (!projectId) {
      console.error('Project ID not found in PATCH URL:', request.url);
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get current user ID - projects are only accessible to assigned users
    const userId = decoded.id || decoded.user_id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 403 });
    }
    const userObjectId = new ObjectId(userId);

    const body = await request.json();
    const { taskId, title, description, assignee, status: taskStatus, priority, dueDate, attachments, subtasks } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');
    const tasksCollection = db.collection('tasks');

    // Verify user has access to this project (must be assigned) - regular users only
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // For regular users only, enforce that they must be assigned to the project
    if (decoded.role !== 'Admin') {
      // Check if user is assigned to this project
      if (!project.assignee || !Array.isArray(project.assignee) || project.assignee.length === 0) {
        // Project has no assignees - deny access
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this project.' },
          { status: 403 }
        );
      }

      // Check if user's ObjectId is in the assignee array
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

    // Get existing task
    const existingTask = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
      projectId: new ObjectId(projectId),
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (attachments !== undefined) updateData.attachments = attachments;
    if (subtasks !== undefined) updateData.subtasks = subtasks;

    // Handle assignee update (array of user IDs)
    if (assignee !== undefined) {
      if (Array.isArray(assignee) && assignee.length > 0) {
        try {
          const usersCollection = db.collection('users');
          const assigneeIds: ObjectId[] = [];
          
          // Validate all assignee IDs exist
          for (const assigneeIdStr of assignee) {
            if (!assigneeIdStr || assigneeIdStr.trim() === '') continue;
            
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
          updateData.assignee = assigneeIds;

          // Send notifications to newly assigned users (only if admin is assigning)
          if (decoded.role === 'Admin') {
            const org_id = getOrgIdFromToken(decoded);
            
            // Get existing assignees to find newly added ones
            const existingAssignees = existingTask.assignee 
              ? (Array.isArray(existingTask.assignee) 
                  ? existingTask.assignee.map((id: any) => id.toString()) 
                  : [existingTask.assignee.toString()])
              : [];
            
            const newAssignees = assigneeIds
              .map(id => id.toString())
              .filter(id => !existingAssignees.includes(id));

            if (newAssignees.length > 0) {
              // Get admin info for notification message
              const admin = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
              const adminName = admin
                ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email
                : 'Admin';

              const taskTitle = title || existingTask.title || 'a task';
              const projectName = project.name || 'a project';

              // Send notifications to newly assigned users
              for (const newAssigneeId of newAssignees) {
                try {
                  // Don't notify if admin assigned themselves
                  if (newAssigneeId === decoded.id) continue;

                  await createNotification({
                    userId: new ObjectId(newAssigneeId),
                    message: `${adminName} has assigned you to task "${taskTitle}" in project "${projectName}"`,
                    type: 'info',
                    org_id: org_id || undefined,
                  });
                } catch (error) {
                  console.error(`Error creating notification for user ${newAssigneeId}:`, error);
                  // Continue with other notifications even if one fails
                }
              }
            }
          }
        } catch (error) {
          return NextResponse.json({ error: 'Invalid assignee ID format' }, { status: 400 });
        }
      } else {
        updateData.assignee = [];
      }
    }

    // Handle status update with history tracking
    if (taskStatus && taskStatus !== existingTask.status) {
      // Validate status transition
      const validStatusValues = TASK_STATUSES.map((s) => s.value);
      if (!validStatusValues.includes(taskStatus)) {
        const validStatusLabels = TASK_STATUSES.map((s) => s.label).join(', ');
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatusLabels}` },
          { status: 400 }
        );
      }

      // Allow all status transitions - users and admins can revert tasks as needed
      // Removed backward progression restriction to allow reverting from completed to pending
      updateData.status = taskStatus;

      // Add to status history
      const statusHistory = existingTask.statusHistory || [];
      statusHistory.push({
        status: taskStatus,
        timestamp: new Date(),
        changedBy: decoded.id,
      });
      updateData.statusHistory = statusHistory;
    }

    // Extract mentions from new description and compare with old description
    if (description && description !== existingTask.description) {
      const oldMentions = extractMentionsFromHTML(existingTask.description || '');
      const newMentions = extractMentionsFromHTML(description);

      // Find newly mentioned users (in new but not in old)
      const newlyMentioned = newMentions.filter(id => !oldMentions.includes(id));

      if (newlyMentioned.length > 0) {
        const usersCollection = db.collection('users');

        // Get org_id from token for notification scoping
        const org_id = getOrgIdFromToken(decoded);

        // Get task updater info for notification message
        const updater = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
        const updaterName = updater
          ? `${updater.firstName || ''} ${updater.lastName || ''}`.trim() || updater.email
          : 'Someone';

        const taskTitle = title || existingTask.title || 'a task';

        // Send notifications to newly mentioned users
        for (const mentionedUserId of newlyMentioned) {
          try {
            // Validate ObjectId format
            if (!ObjectId.isValid(mentionedUserId)) {
              console.warn(`Invalid mention user ID format: ${mentionedUserId}`);
              continue;
            }

            // Don't notify the updater if they mentioned themselves
            if (mentionedUserId === decoded.id) continue;

            // Verify user exists
            const mentionedUser = await usersCollection.findOne({ _id: new ObjectId(mentionedUserId) });
            if (!mentionedUser) {
              console.warn(`Mentioned user not found: ${mentionedUserId}`);
              continue;
            }

            await createNotification({
              userId: new ObjectId(mentionedUserId),
              message: `${updaterName} mentioned you in task "${taskTitle}"`,
              type: 'info',
              org_id: org_id || undefined, // Include org_id if available
            });
          } catch (error) {
            console.error(`Error creating notification for user ${mentionedUserId}:`, error);
            // Continue with other notifications even if one fails
          }
        }
      }
    }

    // Update the task
    await tasksCollection.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: updateData }
    );

    // Get updated task with assignee info
    const updatedTask = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
    });

    // Populate assignee info if exists
    let assigneeInfo: any[] = [];
    const assigneeIds = updatedTask?.assignee ? (Array.isArray(updatedTask.assignee) ? updatedTask.assignee : [updatedTask.assignee]) : [];
    
    if (assigneeIds.length > 0) {
      const usersCollection = db.collection('users');
      const objectIds = assigneeIds.map(id => typeof id === 'string' ? new ObjectId(id) : id);
      const assigneeUsers = await usersCollection.find({
        _id: { $in: objectIds },
      }).toArray();
      
      assigneeInfo = assigneeUsers.map(user => ({
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }));
    }

    const taskResponse: any = {
      ...updatedTask,
      _id: updatedTask?._id?.toString(),
      projectId: updatedTask?.projectId?.toString(),
    };
    
    // Include assignee array (convert to array if it's a single ObjectId from old data)
    if (updatedTask?.assignee) {
      if (Array.isArray(updatedTask.assignee)) {
        taskResponse.assignee = updatedTask.assignee.map((id: any) => id.toString());
      } else {
        // Handle legacy single assignee format - convert to array
        taskResponse.assignee = [updatedTask.assignee.toString()];
      }
    } else {
      taskResponse.assignee = [];
    }
    
    if (assigneeInfo.length > 0) {
      taskResponse.assigneeInfo = assigneeInfo;
    }

    return NextResponse.json(
      { success: true, task: taskResponse },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
    // If it's an ObjectId error, provide more helpful message
    if (errorMessage.includes('ObjectId') || errorMessage.includes('BSON')) {
      return NextResponse.json(
        { success: false, error: 'Invalid task, project, or assignee ID format' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE: Delete a task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Extract project ID from params or URL path
    let projectId = params?.id;
    if (!projectId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const projectIndex = pathParts.findIndex((part) => part === 'projects');
      if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
        projectId = pathParts[projectIndex + 1];
      }
    }

    if (!projectId) {
      console.error('Project ID not found in DELETE URL:', request.url);
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');

    // Verify task belongs to project
    const task = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
      projectId: new ObjectId(projectId),
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete the task
    const result = await tasksCollection.deleteOne({
      _id: new ObjectId(taskId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
    // If it's an ObjectId error, provide more helpful message
    if (errorMessage.includes('ObjectId') || errorMessage.includes('BSON')) {
      return NextResponse.json(
        { success: false, error: 'Invalid task or project ID format' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}


