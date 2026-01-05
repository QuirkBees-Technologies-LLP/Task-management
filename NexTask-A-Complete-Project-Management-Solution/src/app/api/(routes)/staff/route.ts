import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, userRolesServer, getOrgIdFromToken, verifySystemAdmin } from '../../helpers';

// GET: Fetch all staff members
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Build query
    const query: any = {};
    // Add org_id filter if not system admin or if org_id is specified
    if (org_id) {
      query.org_id = org_id;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const total = await usersCollection.countDocuments(query);
    const skip = (page - 1) * limit;

    const staff = await usersCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch departments to populate department and position names (filtered by org_id if applicable)
    const departmentsCollection = db.collection('departments');
    const deptQuery: any = {};
    if (org_id) {
      deptQuery.org_id = org_id;
    }
    const departments = await departmentsCollection.find(deptQuery).toArray();
    const departmentsMap = new Map();
    departments.forEach((dept) => {
      departmentsMap.set(dept._id.toString(), {
        name: dept.name,
        positions: new Map((dept.positions || []).map((pos: any) => [
          pos._id?.toString() || pos.id || '',
          pos.name || '',
        ])),
      });
    });

    return NextResponse.json(
      {
        success: true,
        staff: staff.map((s) => {
          const staffData: any = {
            ...s,
            _id: s._id.toString(),
          };

          // Include departmentId and positionId for form pre-selection
          if (s.departmentId) {
            const deptId = typeof s.departmentId === 'string' ? s.departmentId : s.departmentId.toString();
            staffData.departmentId = deptId;
            const deptInfo = departmentsMap.get(deptId);
            if (deptInfo) {
              staffData.department = deptInfo.name;
              if (s.positionId) {
                const posId = typeof s.positionId === 'string' ? s.positionId : s.positionId.toString();
                staffData.positionId = posId;
                staffData.position = deptInfo.positions.get(posId) || '';
              }
            }
          } else if (s.department) {
            // Fallback for old data format (string department/position)
            staffData.department = s.department;
            staffData.position = s.position || '';
            // Try to find matching departmentId and positionId from departments
            departmentsMap.forEach((deptInfo, deptId) => {
              if (deptInfo.name === s.department) {
                staffData.departmentId = deptId;
                if (s.position) {
                  deptInfo.positions.forEach((posName, posId) => {
                    if (posName === s.position && !staffData.positionId) {
                      staffData.positionId = posId;
                    }
                  });
                }
              }
            });
          }

          return staffData;
        }),
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
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

// POST: Add new staff member
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
    const { firstName, lastName, email, role, departmentId, positionId, phone } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Check if user exists within the same organization
    const existingUser = await usersCollection.findOne({
      email,
      org_id: org_id
    });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const newStaff: any = {
      firstName,
      lastName,
      email,
      role: role || 'Regular',
      phone: phone || '',
      org_id: org_id, // Add org_id
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store departmentId and positionId as ObjectIds if provided
    if (departmentId) {
      newStaff.departmentId = new ObjectId(departmentId);
    }
    if (positionId) {
      newStaff.positionId = new ObjectId(positionId);
    }

    const result = await usersCollection.insertOne(newStaff);

    return NextResponse.json(
      {
        success: true,
        staff: { ...newStaff, _id: result.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}

// PATCH: Update staff member
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
    const { staffId, firstName, lastName, email, role, departmentId, positionId, phone } = body;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Verify staff member belongs to user's organization
    const existingStaff = await usersCollection.findOne({
      _id: new ObjectId(staffId),
      org_id: org_id
    });
    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const setData: any = { updatedAt: new Date() };
    const unsetData: any = {};

    if (firstName) setData.firstName = firstName;
    if (lastName) setData.lastName = lastName;
    if (email) setData.email = email;
    if (role) setData.role = role;
    if (phone !== undefined) setData.phone = phone;

    // Handle departmentId and positionId as ObjectIds
    if (departmentId !== undefined) {
      if (departmentId) {
        setData.departmentId = new ObjectId(departmentId);
        // Remove old string-based department field if it exists
        unsetData.department = '';
        unsetData.position = '';
      } else {
        unsetData.departmentId = '';
        unsetData.positionId = '';
        unsetData.department = '';
        unsetData.position = '';
      }
    }
    if (positionId !== undefined) {
      if (positionId) {
        setData.positionId = new ObjectId(positionId);
        // Remove old string-based position field if it exists
        unsetData.position = '';
      } else {
        unsetData.positionId = '';
      }
    }

    // Build update operation
    const updateOperation: any = {};
    if (Object.keys(setData).length > 0) {
      updateOperation.$set = setData;
    }
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(staffId), org_id: org_id },
      updateOperation
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Staff member updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

// DELETE: Delete staff member
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
    const staffId = searchParams.get('_id');

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Prevent deleting yourself
    if (decoded.id === staffId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    // Verify staff member belongs to user's organization
    const existingStaff = await usersCollection.findOne({
      _id: new ObjectId(staffId),
      org_id: org_id
    });
    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(staffId),
      org_id: org_id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Staff member deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
}

