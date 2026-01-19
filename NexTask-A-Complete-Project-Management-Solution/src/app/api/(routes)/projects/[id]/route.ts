import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifyToken, userRolesServer, getOrgIdFromToken, verifySystemAdmin } from '../../../helpers';
import { sendEmail } from '@/utils/sendEmail';
import { getEmailTemplate } from '@/utils/emailTemplates';
import { ObjectId } from 'mongodb';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Check if system admin
  const systemAdminCheck = await verifySystemAdmin(request);
  const isSystemAdmin = !systemAdminCheck.error;

  // If not system admin, verify as regular user
  let decoded: any;
  if (!isSystemAdmin) {
    const tokenResult = await verifyToken(request);
    if (tokenResult.error) return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    decoded = tokenResult.decoded;
  } else {
    decoded = systemAdminCheck.decoded;
  }

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');

    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // If not system admin, verify project belongs to user's org
    if (!isSystemAdmin) {
      const org_id = getOrgIdFromToken(decoded);
      if (!org_id) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 403 }
        );
      }

      const projectOrgId = project.org_id instanceof ObjectId
        ? project.org_id
        : new ObjectId(project.org_id);

      if (!projectOrgId.equals(org_id)) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get org_id from token
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, clientName, description, dueDate, status: projectStatus } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');

    // Check if project exists and belongs to user's org
    const existingProject = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectOrgId = existingProject.org_id instanceof ObjectId
      ? existingProject.org_id
      : new ObjectId(existingProject.org_id);

    if (!projectOrgId.equals(org_id)) {
      return NextResponse.json(
        { error: 'You can only modify projects in your own organization' },
        { status: 403 }
      );
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (description) updateData.description = description;
    if (projectStatus) updateData.status = projectStatus;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    // Update the project
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(id), org_id: org_id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get updated project
    const updatedProject = await projectsCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, project: updatedProject }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get org_id from token
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, status: projectStatus, startDate, endDate, milestone, updateMessage } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');

    // Get the existing project to compare changes
    const existingProject = await projectsCollection.findOne({ _id: new ObjectId(id) });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectOrgId = existingProject.org_id instanceof ObjectId
      ? existingProject.org_id
      : new ObjectId(existingProject.org_id);

    if (!projectOrgId.equals(org_id)) {
      return NextResponse.json(
        { error: 'You can only modify projects in your own organization' },
        { status: 403 }
      );
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (projectStatus) updateData.status = projectStatus;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (milestone) updateData.milestone = milestone;

    // Update the project
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(id), org_id: org_id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Send notification emails to project members
    // Assumption: projects have a members array with user IDs or emails
    // If not, we'll try to get users from a projectMembers collection or users collection
    try {
      const projectName = name || existingProject.name || 'Project';
      const finalStatus = projectStatus || existingProject.status || '';
      const finalMilestone = milestone || existingProject.milestone || '';

      // Try to get project members from various possible structures
      let memberEmails: string[] = [];
      const memberNames: Record<string, string> = {};

      if (existingProject.members && Array.isArray(existingProject.members)) {
        // If members array contains user IDs
        const memberIds = existingProject.members.map((m: any) =>
          typeof m === 'object' ? new ObjectId(m.userId || m.id || m._id) : new ObjectId(m)
        );
        const usersCollection = db.collection('users');
        const members = await usersCollection.find({ _id: { $in: memberIds }, org_id: org_id }).toArray();
        memberEmails = members.map((m: any) => m.email).filter(Boolean);
        members.forEach((m: any) => {
          if (m.email && m.firstName && m.lastName) {
            memberNames[m.email] = `${m.firstName} ${m.lastName}`;
          }
        });
      } else if (existingProject.memberEmails && Array.isArray(existingProject.memberEmails)) {
        // If members array contains emails directly
        memberEmails = existingProject.memberEmails.filter(Boolean);
      }

      // If no members found, try to get all users in the org (fallback)
      if (memberEmails.length === 0) {
        const usersCollection = db.collection('users');
        const allUsers = await usersCollection.find({ org_id: org_id }).toArray();
        memberEmails = allUsers.map((u: any) => u.email).filter(Boolean);
        allUsers.forEach((u: any) => {
          if (u.email && u.firstName && u.lastName) {
            memberNames[u.email] = `${u.firstName} ${u.lastName}`;
          }
        });
      }

      // Send emails to all members (or skip if no members found)
      if (memberEmails.length > 0) {
        const emailPromises = memberEmails.map(async (email: string) => {
          try {
            const memberName = memberNames[email] || 'Team Member';
            const emailHtml = getEmailTemplate('project-notification', {
              name: memberName,
              projectName,
              status: finalStatus,
              milestone: finalMilestone,
              updateMessage: updateMessage || 'Project has been updated',
            });

            await sendEmail(email, `Project Update: ${projectName}`, emailHtml);
          } catch (emailError) {
            console.error(`Error sending email to ${email}:`, emailError);
            // Continue with other emails even if one fails
          }
        });

        // Send emails in parallel (don't wait for all to complete)
        Promise.all(emailPromises).catch((error) => {
          console.error('Error sending project notification emails:', error);
        });
      }
    } catch (emailError) {
      console.error('Error processing project notification emails:', emailError);
      // Don't fail the update if email sending fails
    }

    return NextResponse.json({ success: true, message: 'Project updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get org_id from token
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const projectsCollection = db.collection('projects');

    // Verify project belongs to user's org
    const existingProject = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectOrgId = existingProject.org_id instanceof ObjectId
      ? existingProject.org_id
      : new ObjectId(existingProject.org_id);

    if (!projectOrgId.equals(org_id)) {
      return NextResponse.json(
        { error: 'You can only delete projects in your own organization' },
        { status: 403 }
      );
    }

    const result = await projectsCollection.deleteOne({ _id: new ObjectId(id), org_id: org_id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Project deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
  }
}
