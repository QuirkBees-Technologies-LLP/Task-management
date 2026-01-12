import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, userRolesServer } from '../../helpers';

// GET: Fetch all departments
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const departmentsCollection = db.collection('departments');

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'positions.name': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await departmentsCollection.countDocuments(query);
    const skip = (page - 1) * limit;

    const departments = await departmentsCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        departments: departments.map((d) => ({
          ...d,
          _id: d._id.toString(),
          // Ensure positions array exists and use _id (ObjectId) field
          positions: (d.positions || []).map((pos: any) => ({
            _id: pos._id?.toString() || pos.id || '',
            name: pos.name || '',
          })),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

// POST: Create new department
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { name, positions } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json(
        { error: 'At least one position is required' },
        { status: 400 }
      );
    }

    // Filter out empty positions and validate
    const validPositions = positions
      .map((pos: any) => pos.name?.trim())
      .filter((name: string) => name && name.length > 0);

    if (validPositions.length === 0) {
      return NextResponse.json(
        { error: 'At least one position is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const departmentsCollection = db.collection('departments');

    // Check if department with same name already exists
    const existingDepartment = await departmentsCollection.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 }
      );
    }

    // Create the department with positions
    // MongoDB will automatically generate _id for each position in the embedded array
    const newDepartment = {
      name: name.trim(),
      positions: validPositions.map((posName: string) => ({
        _id: new ObjectId(), // Generate ObjectId for each position
        name: posName,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await departmentsCollection.insertOne(newDepartment);

    return NextResponse.json(
      {
        success: true,
        department: {
          ...newDepartment,
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}

// PATCH: Update department
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { departmentId, name, positions } = body;

    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const departmentsCollection = db.collection('departments');

    // Get existing department
    const existingDepartment = await departmentsCollection.findOne({
      _id: new ObjectId(departmentId)
    });
    if (!existingDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = { updatedAt: new Date() };

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
      }

      // Check if name is being changed and if new name already exists
      if (name.trim().toLowerCase() !== existingDepartment.name.toLowerCase()) {
        const nameExists = await departmentsCollection.findOne({
          name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
          _id: { $ne: new ObjectId(departmentId) }
        });
        if (nameExists) {
          return NextResponse.json(
            { error: 'Department with this name already exists' },
            { status: 400 }
          );
        }
      }
      updateData.name = name.trim();
    }

    if (positions !== undefined) {
      if (!Array.isArray(positions) || positions.length === 0) {
        return NextResponse.json(
          { error: 'At least one position is required' },
          { status: 400 }
        );
      }

      // Filter out empty positions and validate
      const validPositions = positions
        .map((pos: any) => pos.name?.trim())
        .filter((name: string) => name && name.length > 0);

      if (validPositions.length === 0) {
        return NextResponse.json(
          { error: 'At least one position is required' },
          { status: 400 }
        );
      }

      // Preserve existing position _id where possible, or generate new ObjectId
      updateData.positions = validPositions.map((posName: string) => {
        // Try to find existing position with same name to preserve _id
        const existingPos = existingDepartment.positions?.find(
          (p: any) => p.name === posName
        );
        return {
          _id: existingPos?._id || new ObjectId(), // Use existing _id or generate new ObjectId
          name: posName,
        };
      });
    }

    await departmentsCollection.updateOne(
      { _id: new ObjectId(departmentId) },
      { $set: updateData }
    );

    return NextResponse.json(
      { success: true, message: 'Department updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

// DELETE: Delete department
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('_id');

    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const departmentsCollection = db.collection('departments');

    // Get department before deleting
    const department = await departmentsCollection.findOne({
      _id: new ObjectId(departmentId)
    });
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Delete department
    await departmentsCollection.deleteOne({
      _id: new ObjectId(departmentId)
    });

    return NextResponse.json(
      { success: true, message: 'Department deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
