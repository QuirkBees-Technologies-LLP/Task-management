import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, userRolesServer, getOrgIdFromToken, verifySystemAdmin } from '../../helpers';

// GET: Fetch all roles and permissions
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Check if system admin
    const systemAdminCheck = await verifySystemAdmin(request);
    const isSystemAdmin = !systemAdminCheck.error;

    // Get org_id from token (unless system admin)
    let org_id: ObjectId | null = null;
    if (!isSystemAdmin) {
      org_id = getOrgIdFromToken(decoded);
      if (!org_id) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 403 }
        );
      }
    } else {
      // System admin can optionally filter by org_id query param
      const { searchParams } = new URL(request.url);
      const orgIdParam = searchParams.get('org_id');
      if (orgIdParam && ObjectId.isValid(orgIdParam)) {
        org_id = new ObjectId(orgIdParam);
      }
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const permissionsCollection = db.collection('rolesAndPermissions');

    // Build query with org_id filter if applicable
    const query: any = {};
    if (org_id) {
      query.org_id = org_id;
    }

    const roles = await permissionsCollection.find(query).toArray();

    return NextResponse.json(
      {
        success: true,
        roles: roles.map((r) => ({
          ...r,
          _id: r._id.toString(),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching roles and permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch roles and permissions' }, { status: 500 });
  }
}

// POST: Create new role
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { roleName, permissions, description } = body;

    if (!roleName) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const permissionsCollection = db.collection('rolesAndPermissions');

    // Check if role exists within the same organization
    const existingRole = await permissionsCollection.findOne({ 
      roleName,
      org_id: org_id
    });
    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    const newRole = {
      roleName,
      permissions: permissions || [],
      description: description || '',
      org_id: org_id, // Add org_id
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
    };

    const result = await permissionsCollection.insertOne(newRole);

    return NextResponse.json(
      {
        success: true,
        role: { ...newRole, _id: result.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

// PATCH: Update role permissions
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { roleId, roleName, permissions, description } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const permissionsCollection = db.collection('rolesAndPermissions');

    // Verify role belongs to user's organization
    const existingRole = await permissionsCollection.findOne({ 
      _id: new ObjectId(roleId),
      org_id: org_id
    });
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (roleName) updateData.roleName = roleName;
    if (permissions) updateData.permissions = permissions;
    if (description !== undefined) updateData.description = description;

    const result = await permissionsCollection.updateOne(
      { _id: new ObjectId(roleId), org_id: org_id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Role updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE: Delete role
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('_id');

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const permissionsCollection = db.collection('rolesAndPermissions');

    // Verify role belongs to user's organization
    const existingRole = await permissionsCollection.findOne({ 
      _id: new ObjectId(roleId),
      org_id: org_id
    });
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const result = await permissionsCollection.deleteOne({ 
      _id: new ObjectId(roleId),
      org_id: org_id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Role deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}

