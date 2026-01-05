import clientPromise from './mongodb';
import { DATABASE_NAME } from '../config';
import { ObjectId } from 'mongodb';

export interface NotificationInput {
  userId: string | ObjectId;
  message: string;
  type?: 'info' | 'success' | 'error';
  read?: boolean;
}

/**
 * Saves a new notification to the MongoDB `notifications` collection.
 * @param notification - The notification to create.
 * @returns The inserted notification's ID.
 */
export async function createNotification(notification: NotificationInput) {
  const { userId, message, type = 'info', read = false } = notification;

  if (!userId || !message) {
    throw new Error('userId and message are required to create a notification.');
  }

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);

  const result = await db.collection('notifications').insertOne({
    userId,
    message,
    type,
    read,
    createdAt: new Date(),
  });

  return result.insertedId;
}
