import clientPromise from './mongodb';
import { DATABASE_NAME } from '../config';
import { ObjectId } from 'mongodb';

export interface NotificationInput {
  userId: string | ObjectId;
  message: string;
  type?: 'info' | 'success' | 'error';
  read?: boolean;
  org_id?: ObjectId;
}

/**
 * Saves a new notification to the MongoDB `notifications` collection.
 * @param notification - The notification to create.
 * @returns The inserted notification's ID.
 */
export async function createNotification(notification: NotificationInput) {
  const { userId, message, type = 'info', read = false, org_id } = notification;

  if (!userId || !message) {
    throw new Error('userId and message are required to create a notification.');
  }

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);

  // Ensure userId is ObjectId
  const userIdObj = userId instanceof ObjectId ? userId : new ObjectId(userId);

  const notificationData: any = {
    userId: userIdObj,
    message,
    type,
    read,
    createdAt: new Date(),
  };

  // Add org_id if provided
  if (org_id) {
    notificationData.org_id = org_id;
  }

  const result = await db.collection('notifications').insertOne(notificationData);

  return result.insertedId;
}
