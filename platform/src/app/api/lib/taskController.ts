import { DATABASE_NAME } from '../config';
import clientPromise from '../lib/mongodb';
import { createNotification } from '../lib/notification';
import { sendEmail } from '@/utils/sendEmail';
import { getEmailTemplate } from '@/utils/emailTemplates';
import { ObjectId } from 'mongodb';

export async function addTaskForAllUsers(task) {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const users = await db.collection('users').find().toArray();
    const userTasksCollection = db.collection('userTasks');
    const tasksCollection = db.collection('tasks');

    // Get the full task details
    const taskDetails = await tasksCollection.findOne({ _id: task.insertedId });

    if (!taskDetails) {
      console.error('Task not found:', task.insertedId);
      return;
    }

    for (const user of users) {
      // Assign task to all users
      await userTasksCollection.insertOne({
        userId: new ObjectId(user._id),
        status: 'todo',
        taskId: task.insertedId,
      });

      await createNotification({
        userId: new ObjectId(user._id),
        message: 'New Task has been assigned to you',
        type: 'info',
      });

      // Send task assignment email
      if (user.email) {
        try {
          const userName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email;

          const taskName = taskDetails.title || 'New Task';
          const taskDescription = taskDetails.description || '';
          const dueDate = taskDetails.dueDate
            ? new Date(taskDetails.dueDate).toLocaleDateString()
            : '';
          const priority = taskDetails.priority || 'medium';

          const emailHtml = getEmailTemplate('task-assigned', {
            name: userName,
            taskName,
            taskDescription,
            dueDate,
            priority,
          });

          await sendEmail(
            user.email,
            `New Task Assigned: ${taskName}`,
            emailHtml
          );
        } catch (emailError) {
          console.error(`Error sending task assignment email to ${user.email}:`, emailError);
          // Continue with other users even if one email fails
        }
      }
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function deleteTaskForAllUsers(taskId) {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const userTasksCollection = db.collection('userTasks');

    await userTasksCollection.deleteMany({ taskId: new ObjectId(taskId) });
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function assignTasksToUser(userId) {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const tasksCollection = db.collection('tasks');
    const userTasksCollection = db.collection('userTasks');
    const usersCollection = db.collection('users');

    // Get user details
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user || !user.email) {
      console.error('User not found or has no email:', userId);
      return;
    }

    const tasks = await tasksCollection.find({}).toArray();
    const userName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email;

    // Track if we've sent at least one email
    let emailSent = false;

    for (const task of tasks) {
      await userTasksCollection.insertOne({
        userId: new ObjectId(userId),
        status: 'todo',
        taskId: task._id,
      });

      // Send email for the first task (or could send for all, but that might be too many emails)
      if (!emailSent && task.title) {
        try {
          const taskName = task.title || 'New Task';
          const taskDescription = task.description || '';
          const dueDate = task.dueDate
            ? new Date(task.dueDate).toLocaleDateString()
            : '';
          const priority = task.priority || 'medium';

          const emailHtml = getEmailTemplate('task-assigned', {
            name: userName,
            taskName: tasks.length > 1
              ? `Multiple Tasks (${tasks.length} tasks assigned)`
              : taskName,
            taskDescription: tasks.length > 1
              ? `You have been assigned ${tasks.length} tasks. Please log in to view them all.`
              : taskDescription,
            dueDate,
            priority,
          });

          await sendEmail(
            user.email,
            tasks.length > 1
              ? `Tasks Assigned: ${tasks.length} new tasks`
              : `New Task Assigned: ${taskName}`,
            emailHtml
          );
          emailSent = true;
        } catch (emailError) {
          console.error(`Error sending task assignment email to ${user.email}:`, emailError);
        }
      }
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}
