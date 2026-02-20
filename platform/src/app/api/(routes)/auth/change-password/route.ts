import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../../../helpers';
import { createNotification } from '../../../lib/notification';
import { assignTasksToUser } from '@/app/api/lib/taskController';

export async function POST(request: Request) {
  const { decoded: decodedToken, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const { id: userId } = decodedToken;

  try {
    const body = await request.json();

    const { oldPassword, newPassword } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Find the user by ID
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate the request body
    if (!oldPassword) {
      return NextResponse.json({ error: 'Old password is required' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    // Validate old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return NextResponse.json({ error: 'Old password is incorrect' }, { status: 401 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword, // Hashed password for authentication
          plainTextPassword: newPassword, // Store plain text password for admin viewing
          isTemporaryPassword: false, // Mark the password as permanent
        },
      }
    );

    await createNotification({
      userId: new ObjectId(userId),
      message: 'Your password was changed successfully',
      type: 'success',
    });

    const userTasks = await db
      .collection('userTasks')
      .find({
        userId: new ObjectId(userId),
      })
      .toArray();
    if (userTasks.length === 0) {
      await assignTasksToUser(userId);
    }

    return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in change password API:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
