import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, userRolesServer } from '../../helpers';

// GET: Fetch all roles and permissions
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const permissionsCollection = db.collection('rolesAndPermissions');

    const roles = await permissionsCollection.find({}).toArray();

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

    // Check if role exists
    const existingRole = await permissionsCollection.findOne({ 
      roleName
    });
    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    const newRole = {
      roleName,
      permissions: permissions || [],
      description: description || '',
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
    const body = await request.json();
    const { roleId, roleName, permissions, description } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const permissionsCollection = db.collection('rolesAndPermissions');

    // Verify role exists
    const existingRole = await permissionsCollection.findOne({ 
      _id: new ObjectId(roleId)
    });
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (roleName) updateData.roleName = roleName;
    if (permissions) updateData.permissions = permissions;
    if (description !== undefined) updateData.description = description;

    const result = await permissionsCollection.updateOne(
      { _id: new ObjectId(roleId) },
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
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('_id');

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const permissionsCollection = db.collection('rolesAndPermissions');

    // Verify role exists
    const existingRole = await permissionsCollection.findOne({ 
      _id: new ObjectId(roleId)
    });
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const result = await permissionsCollection.deleteOne({ 
      _id: new ObjectId(roleId)
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

