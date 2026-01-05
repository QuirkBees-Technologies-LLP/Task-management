import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, senderEmail, tokenExpiryLong } from '../../config';
import bcrypt from 'bcrypt';
import { extractPublicId, userRolesServer, verifyToken } from '../../helpers';
import { sendEmail } from '../../lib/email';
import { emailTemplateVariables } from '@/utils/constants';
import jwt from 'jsonwebtoken';
import cloudinary from '../../lib/cloudinary';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentUser = searchParams.get('currentUser') === 'true'; // Check if currentUser is true

  const { decoded, error, status } = await verifyToken(
    request,
    currentUser ? undefined : userRolesServer.admin
  );

  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const myUser = await usersCollection.findOne({
      _id: new ObjectId(decoded.id),
    });

    if (currentUser) {
      const userId = decoded.id;
      const userEmail = decoded.email;

      let currentUser;

      if (userId) {
        // Fetch the current user by ID
        currentUser = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });
      }
      if (userEmail) {
        // Fetch the current user by email
        currentUser = await usersCollection.findOne({
          email: userEmail,
        });
      }

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(currentUser, { status: 200 });
    }

    // Fetch all users if currentUser is not true
    const users = await usersCollection.find().toArray();

    const filteredUsers = users.filter((user) => user.email !== myUser?.email);

    return NextResponse.json(filteredUsers, { status: 200 });
  } catch (error) {
    console.error('Error fetching user(s):', error);
    return NextResponse.json({ error: 'Failed to fetch user(s)' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();

    const { email, firstName, lastName, superuser } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const emailTemplatesCollection = db.collection('emailTemplates');

    const myUser = await usersCollection.findOne({
      _id: new ObjectId(decoded.id),
    });

    // Validate each user object
    if (!email || !firstName || !lastName) {
      if (body.length === 1) {
        return NextResponse.json(
          {
            error: 'All fields (email, firstName, lastName) are required',
          },
          { status: 400 }
        );
      }
    }

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8); // Generate an 8-character random password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the user in the database
    const newUser = await usersCollection.insertOne({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      createdAt: new Date(),
      isTemporaryPassword: true, // Flag to indicate the password is temporary
      role: superuser ? userRolesServer.admin : userRolesServer.regular, // Default role for invited users
      companyId: myUser?.companyId,
      superuser: superuser ?? false, // Set superuser based on the request
    });

    // Send an email to the user with the temporary password
    const invTemplate = await emailTemplatesCollection.findOne({
      emailType: 'invite',
    });

    if (!invTemplate) {
      return NextResponse.json({ error: 'User added! Email template not found' }, { status: 404 });
    }

    // Replace placeholders in the email template
    const baseUrl = `${request.headers.get('origin')}`;
    const token = jwt.sign(
      {
        id: newUser.insertedId,
        email: email,
        password: tempPassword,
      },
      JWT_SECRET,
      {
        expiresIn: tokenExpiryLong,
      }
    );
    const inviteLink = `${baseUrl}/change-password?token=${token}`;
    // Replace placeholders in the template
    const emailHtml = invTemplate?.htmlString
      .replace(emailTemplateVariables.name, `${firstName} ${lastName}`)
      .replace(emailTemplateVariables.email, email)
      .replace(emailTemplateVariables.password, tempPassword)
      .replace(emailTemplateVariables.btnLink, inviteLink);

    await sendEmail({
      to: email,
      subject: "You're invited",
      html: emailHtml,
      from: senderEmail ?? 'default@gmail.com', // Fallback to a default email if undefined
    });

    return NextResponse.json({ message: 'User added successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error adding users:', error);
    return NextResponse.json({ error: 'Failed to add users' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { firstName, lastName, country, gender, photo } = body[0] ?? body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.id),
    });

    // Update the current user
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(decoded.id) },
      { $set: { firstName, lastName, country, gender } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (photo) {
      if (user?.photoUrl !== photo) {
        const uploadResponse = await cloudinary.uploader.upload(photo, {
          folder: 'profile_pics',
        });

        usersCollection.updateOne(
          { _id: new ObjectId(decoded.id) },
          { $set: { photoUrl: uploadResponse.secure_url } }
        );
      }
    } else if (user?.photoUrl) {
      const publicId = extractPublicId(user?.photoUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        usersCollection.updateOne({ _id: new ObjectId(decoded.id) }, { $set: { photoUrl: null } });
      }
    }

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Delete the user
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
