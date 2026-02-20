import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, senderEmail, tokenExpiryLong } from '../../config';
import bcrypt from 'bcryptjs';
import { userRolesServer, verifyToken, extractPublicId, requireOrgIdFromToken, getOrgIdFromToken } from '../../helpers';
import { sendEmail } from '../../lib/email';
import { emailTemplateVariables } from '@/utils/constants';
import jwt from 'jsonwebtoken';
import cloudinary from '../../lib/cloudinary';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../lib/orgIdHelper';

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

    // Get org_id from token for organization scoping
    const org_id = getOrgIdFromToken(decoded);
    
    // Build query with org_id filter
    const query: any = {};
    if (org_id) {
      query.org_id = org_id;
    }

    if (myUser?.email) {
      query.email = { $ne: myUser.email };
    }

    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '0', 10);

    if (page > 0 && limit > 0) {
      const totalCount = await usersCollection.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;

      const users = await usersCollection.find(query).skip(skip).limit(limit).toArray();

      return NextResponse.json(
        { users, pagination: { totalPages, currentPage: page, totalCount } },
        { status: 200 }
      );
    }

    const users = await usersCollection.find(query).toArray();

    return NextResponse.json(users, { status: 200 });
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

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const emailTemplatesCollection = db.collection('emailTemplates');

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

    // Check if the user already exists in the same organization
    const existingUser = await usersCollection.findOne({ 
      email,
      org_id: org_id 
    });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists in your organization' }, { status: 400 });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8); // Generate an 8-character random password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the user in the database with org_id
    const newUserData = addOrgIdToDocument({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemporaryPassword: true, // Flag to indicate the password is temporary
      role: superuser ? userRolesServer.admin : userRolesServer.regular, // Default role for invited users
      superuser: superuser ?? false, // Set superuser based on the request
      emailVerified: false,
    }, org_id);

    const newUser = await usersCollection.insertOne(newUserData);

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

export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(userRolesServer).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be Admin or Regular' },
        { status: 400 }
      );
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Get the user to update - must be in the same organization
    const userToUpdate = await usersCollection.findOne({ 
      _id: new ObjectId(userId),
      org_id: org_id 
    });
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 });
    }

    // Prevent users from changing their own role
    if (decoded.id === userId || decoded.user_id === userId) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    // Update the user's role
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User role updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Get the user to delete - must be in the same organization
    const userToDelete = await usersCollection.findOne({ 
      _id: new ObjectId(id),
      org_id: org_id 
    });
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 });
    }

    // Prevent users from deleting themselves
    if (decoded.id === id || decoded.user_id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete the user
    const result = await usersCollection.deleteOne({ 
      _id: new ObjectId(id),
      org_id: org_id 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
