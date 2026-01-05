import { DATABASE_NAME } from '../config';
import clientPromise from '../lib/mongodb';
import { createNotification } from '../lib/notification';
import { ObjectId } from 'mongodb';

export async function addTaskForAllUsers(task) {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const users = await db.collection('users').find().toArray();
    const userTasksCollection = db.collection('userTasks');

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

    const tasks = await tasksCollection.find({}).toArray();

    for (const task of tasks) {
      await userTasksCollection.insertOne({
        userId: new ObjectId(userId),
        status: 'todo',
        taskId: task._id,
      });
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}
