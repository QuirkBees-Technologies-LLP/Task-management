import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, userRolesServer, requireOrgIdFromToken, getOrgIdFromToken } from '../../helpers';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../lib/orgIdHelper';

// GET: Fetch all staff members
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Build query with org_id filter
    const query: any = addOrgIdToQuery({}, org_id);
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

    // Fetch staff - explicitly include plainTextPassword field
    const staff = await usersCollection
      .find(query, { projection: { password: 0 } }) // Exclude hashed password from response
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch departments to populate department and position names (scoped to organization)
    const departmentsCollection = db.collection('departments');
    const departments = await departmentsCollection.find(addOrgIdToQuery({}, org_id)).toArray();
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
          // Get plainTextPassword - this is what admin sees
          // Note: password field is already excluded from projection above
          const plainTextPassword = (s as any).plainTextPassword || '';
          const staffData: any = {
            ...s,
            _id: s._id.toString(),
            // Include plainTextPassword for admin viewing (password is visible to admin)
            password: plainTextPassword, // Return plain text password for admin - this is what admin sees
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
    const body = await request.json();
    const { firstName, lastName, email, password, role, departmentId, positionId, phone } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Check if user exists in the same organization
    const existingUser = await usersCollection.findOne(
      addOrgIdToQuery({ email }, org_id)
    );
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists in your organization' }, { status: 400 });
    }
    const organizationsCollection = db.collection('organizations');
    const plansCollection = db.collection('plans');

    const organization = await organizationsCollection.findOne({ _id: new ObjectId(org_id) });

    if (organization && organization.planId) {
      const plan = await plansCollection.findOne({ _id: new ObjectId(organization.planId) });

      if (plan) {
        let maxUsers = typeof plan.users_allowed === 'number' ? plan.users_allowed : 0;
        const isUnlimited = maxUsers === -1;

        if (!isUnlimited) {
            if (organization.addons && Array.isArray(organization.addons)) {
                const activeAddons = organization.addons.filter((addon: any) => addon.status === 'active');
                if (activeAddons.length > 0) {
                    const addonPlanIds = activeAddons.map((addon: any) => new ObjectId(addon.planId));
                    const addonPlans = await plansCollection.find({ _id: { $in: addonPlanIds } }).toArray();
                    
                    const addonLimit = addonPlans.reduce((sum, p) => sum + (p.users_allowed || 0), 0);
                    maxUsers += addonLimit;
                }
            }

            const currentStaffCount = await usersCollection.countDocuments({ org_id: org_id });

            if (currentStaffCount >= maxUsers) {
                return NextResponse.json(
                    {
                    error: `Plan limit reached. Your plan allows ${maxUsers} users. Please purchase an Add-on to add more staff.`
                    },
                    { status: 403 }
                );
            }
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff: any = addOrgIdToDocument({
      firstName,
      lastName,
      email,
      password: hashedPassword, // Hashed password for authentication
      plainTextPassword: password, // Store plain text password for admin viewing
      role: role || 'Regular',
      phone: phone || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, org_id);

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
    const body = await request.json();
    const { staffId, firstName, lastName, email, password, role, departmentId, positionId, phone } = body;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Verify staff member exists in the same organization
    const existingStaff = await usersCollection.findOne(
      addOrgIdToQuery({
        _id: new ObjectId(staffId)
      }, org_id)
    );
    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found in your organization' }, { status: 404 });
    }

    const setData: any = { updatedAt: new Date() };
    const unsetData: any = {};

    if (firstName) setData.firstName = firstName;
    if (lastName) setData.lastName = lastName;
    if (email) setData.email = email;
    if (role) setData.role = role;
    if (phone !== undefined) setData.phone = phone;
    
    // Handle password update - only if provided
    if (password !== undefined && password !== null) {
      if (password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        setData.password = hashedPassword; // Hashed password for authentication
        setData.plainTextPassword = password; // Store plain text password for admin viewing
      }
      // If password is empty string, we keep the existing password (don't update)
    }

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
      addOrgIdToQuery({ _id: new ObjectId(staffId) }, org_id),
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
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('_id');

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Prevent deleting yourself
    if (decoded.id === staffId || decoded.user_id === staffId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    // Verify staff member exists in the same organization
    const existingStaff = await usersCollection.findOne(
      addOrgIdToQuery({
        _id: new ObjectId(staffId)
      }, org_id)
    );
    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found in your organization' }, { status: 404 });
    }

    const result = await usersCollection.deleteOne(
      addOrgIdToQuery({
        _id: new ObjectId(staffId)
      }, org_id)
    );

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Staff member deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
}

