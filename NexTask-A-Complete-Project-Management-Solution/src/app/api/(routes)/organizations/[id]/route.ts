import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifyToken, userRolesServer } from '../../../helpers';
import { validateSlug, normalizeSlug } from '../../../lib/organizations';

// GET: Fetch single organization by ID (Admin only)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');
    const usersCollection = db.collection('users');

    const organization = await organizationsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Populate owner information
    let ownerInfo = null;
    if (organization.ownerId) {
      const owner = await usersCollection.findOne({
        _id: new ObjectId(organization.ownerId),
      });
      if (owner) {
        ownerInfo = {
          _id: owner._id.toString(),
          firstName: owner.firstName || '',
          lastName: owner.lastName || '',
          email: owner.email || '',
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        organization: {
          ...organization,
          _id: organization._id.toString(),
          ownerId: organization.ownerId ? organization.ownerId.toString() : null,
          owner: ownerInfo,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}

// PATCH: Update organization (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { id } = params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    // Check if organization exists
    const existingOrg = await organizationsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Validate name if provided
    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length < 2 || body.name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Organization name must be between 2 and 100 characters' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    // Handle slug change - track history
    if (body.slug && body.slug !== existingOrg.slug) {
      // Normalize and validate slug
      const normalizedSlug = normalizeSlug(body.slug);
      if (!validateSlug(normalizedSlug)) {
        return NextResponse.json(
          { error: 'Slug must contain only lowercase letters, numbers, and hyphens (max 50 characters)' },
          { status: 400 }
        );
      }

      // Check if new slug already exists
      const slugExists = await organizationsCollection.findOne({
        slug: normalizedSlug,
        deletedAt: null,
        _id: { $ne: new ObjectId(id) },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Organization with this slug already exists' },
          { status: 400 }
        );
      }

      // Update slug and add to history
      updateData.slug = normalizedSlug;
      const slugHistory = existingOrg.slug_history || [existingOrg.slug];
      if (!slugHistory.includes(normalizedSlug)) {
        updateData.slug_history = [...slugHistory, normalizedSlug];
      }
    }

    // Update other fields if provided
    if (body.status !== undefined) {
      if (!['active', 'inactive'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Status must be either "active" or "inactive"' },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }
    if (body.planName !== undefined) updateData.planName = body.planName;
    if (body.planStartDate !== undefined) {
      updateData.planStartDate = body.planStartDate ? new Date(body.planStartDate) : null;
    }
    if (body.planEndDate !== undefined) {
      updateData.planEndDate = body.planEndDate ? new Date(body.planEndDate) : null;
    }

    const result = await organizationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch updated organization
    const updatedOrg = await organizationsCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      {
        success: true,
        organization: {
          ...updatedOrg,
          _id: updatedOrg!._id.toString(),
          ownerId: updatedOrg!.ownerId ? updatedOrg!.ownerId.toString() : null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating organization:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Organization with this slug already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}

// DELETE: Soft delete organization (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    const result = await organizationsCollection.updateOne(
      { _id: new ObjectId(id), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Organization deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
  }
}

