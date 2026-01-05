import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifySystemAdmin } from '../../../../helpers';
import { validateSlug, normalizeSlug } from '../../../../lib/organizations';
import { clearSlugCache } from '../../../../lib/orgMiddleware';

/**
 * GET: Fetch single organization by ID
 * SuperAdmin only endpoint
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Verify JWT
  // 2. Ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    // Find organization by _id, excluding soft-deleted ones
    const organization = await organizationsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Populate owner information
    const usersCollection = db.collection('users');
    let ownerEmail = null;
    let ownerFirstName = null;
    let ownerLastName = null;
    if (organization.ownerId) {
      const owner = await usersCollection.findOne({ _id: new ObjectId(organization.ownerId) });
      if (owner) {
        ownerEmail = owner.email || null;
        ownerFirstName = owner.firstName || null;
        ownerLastName = owner.lastName || null;
      }
    }

    // Return organization details with the specified structure
    return NextResponse.json(
      {
        success: true,
        organization: {
          _id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
          ownerId: organization.ownerId ? organization.ownerId.toString() : null,
          ownerEmail,
          ownerFirstName,
          ownerLastName,
          planName: organization.planName || '',
          planStartDate: organization.planStartDate || null,
          planEndDate: organization.planEndDate || null,
          createdAt: organization.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update organization details
 * SuperAdmin only endpoint
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Verify JWT
  // 2. Ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      planName,
      planStartDate,
      planEndDate,
      status,
      owner,
    } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    // Check if organization exists and is not deleted
    const existingOrg = await organizationsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Validate and update name if provided
    if (name !== undefined) {
      if (name.length < 2 || name.length > 100) {
        return NextResponse.json(
          { error: 'Organization name must be between 2 and 100 characters' },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    // Validate and update slug if provided
    if (slug !== undefined) {
      // Normalize and validate slug
      const normalizedSlug = normalizeSlug(slug);
      if (!validateSlug(normalizedSlug)) {
        return NextResponse.json(
          { error: 'Slug must contain only lowercase letters, numbers, and hyphens (max 50 characters)' },
          { status: 400 }
        );
      }

      // Check if slug is being changed
      if (normalizedSlug !== existingOrg.slug) {
        // Store old slug for cache invalidation
        const oldSlug = existingOrg.slug;

        // Validate slug uniqueness (excluding current organization)
        const slugExists = await organizationsCollection.findOne({
          slug: normalizedSlug,
          deletedAt: null,
          _id: { $ne: new ObjectId(id) },
        });

        if (slugExists) {
          return NextResponse.json(
            { error: 'Organization with this slug already exists' },
            { status: 409 }
          );
        }

        // Update slug history - append new slug to history array
        const currentHistory = existingOrg.slug_history || [existingOrg.slug];
        if (!currentHistory.includes(normalizedSlug)) {
          updateData.slug_history = [...currentHistory, normalizedSlug];
        }

        // Invalidate cache for old slug
        clearSlugCache(oldSlug);
        // Also clear new slug cache to force refresh
        clearSlugCache(normalizedSlug);
      }

      updateData.slug = normalizedSlug;
    }

    // Update plan fields if provided
    if (planName !== undefined) {
      updateData.planName = planName || '';
    }

    if (planStartDate !== undefined) {
      updateData.planStartDate = planStartDate ? new Date(planStartDate) : null;
    }

    if (planEndDate !== undefined) {
      updateData.planEndDate = planEndDate ? new Date(planEndDate) : null;
    }

    // Update status if provided
    if (status !== undefined) {
      // Validate status value
      if (status !== 'active' && status !== 'inactive') {
        return NextResponse.json(
          { error: 'Status must be either "active" or "inactive"' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Update owner information if provided (same structure as create endpoint)
    if (owner !== undefined) {
      const usersCollection = db.collection('users');
      if (!existingOrg.ownerId) {
        return NextResponse.json(
          { error: 'Organization does not have an owner' },
          { status: 400 }
        );
      }

      const ownerUpdateData: any = {};

      // Update firstName if provided
      if (owner.firstName !== undefined) {
        const trimmedFirstName = owner.firstName.trim();
        if (!trimmedFirstName || trimmedFirstName.length < 1) {
          return NextResponse.json(
            { error: 'Owner first name cannot be empty' },
            { status: 400 }
          );
        }
        if (trimmedFirstName.length > 50) {
          return NextResponse.json(
            { error: 'Owner first name must be less than 50 characters' },
            { status: 400 }
          );
        }
        ownerUpdateData.firstName = trimmedFirstName;
      }

      // Update lastName if provided
      if (owner.lastName !== undefined) {
        const trimmedLastName = owner.lastName.trim();
        if (!trimmedLastName || trimmedLastName.length < 1) {
          return NextResponse.json(
            { error: 'Owner last name cannot be empty' },
            { status: 400 }
          );
        }
        if (trimmedLastName.length > 50) {
          return NextResponse.json(
            { error: 'Owner last name must be less than 50 characters' },
            { status: 400 }
          );
        }
        ownerUpdateData.lastName = trimmedLastName;
      }

      // Update email if provided
      if (owner.email !== undefined) {
        const trimmedEmail = owner.email.trim().toLowerCase();
        if (!trimmedEmail) {
          return NextResponse.json(
            { error: 'Owner email cannot be empty' },
            { status: 400 }
          );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return NextResponse.json(
            { error: 'Invalid email format' },
            { status: 400 }
          );
        }

        // Check if email is being changed
        const currentOwner = await usersCollection.findOne({ _id: new ObjectId(existingOrg.ownerId) });
        if (currentOwner && currentOwner.email !== trimmedEmail) {
          // Check if new email already exists (excluding current owner)
          const emailExists = await usersCollection.findOne({
            email: trimmedEmail,
            _id: { $ne: new ObjectId(existingOrg.ownerId) }
          });

          if (emailExists) {
            return NextResponse.json(
              { error: 'User with this email already exists' },
              { status: 409 }
            );
          }
        }

        ownerUpdateData.email = trimmedEmail;
      }

      // Update password if provided (optional for updates)
      if (owner.password !== undefined && owner.password !== '') {
        if (owner.password.length < 6) {
          return NextResponse.json(
            { error: 'Password must be at least 6 characters' },
            { status: 400 }
          );
        }
        const bcrypt = await import('bcrypt');
        ownerUpdateData.password = await bcrypt.hash(owner.password, 10);
      }

      // Update owner user document
      if (Object.keys(ownerUpdateData).length > 0) {
        const ownerUpdateResult = await usersCollection.updateOne(
          { _id: new ObjectId(existingOrg.ownerId) },
          { $set: ownerUpdateData }
        );

        if (ownerUpdateResult.matchedCount === 0) {
          return NextResponse.json(
            { error: 'Owner user not found' },
            { status: 404 }
          );
        }
      }
    }

    // Update the organization
    const result = await organizationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Fetch updated organization
    const updatedOrg = await organizationsCollection.findOne({
      _id: new ObjectId(id),
    });

    // Populate owner information
    const usersCollection = db.collection('users');
    let ownerEmail = null;
    let ownerFirstName = null;
    let ownerLastName = null;
    if (updatedOrg!.ownerId) {
      const owner = await usersCollection.findOne({ _id: new ObjectId(updatedOrg!.ownerId) });
      if (owner) {
        ownerEmail = owner.email || null;
        ownerFirstName = owner.firstName || null;
        ownerLastName = owner.lastName || null;
      }
    }

    // Return updated organization with the same structure as GET
    return NextResponse.json(
      {
        success: true,
        organization: {
          _id: updatedOrg!._id.toString(),
          name: updatedOrg!.name,
          slug: updatedOrg!.slug,
          status: updatedOrg!.status,
          ownerId: updatedOrg!.ownerId ? updatedOrg!.ownerId.toString() : null,
          ownerEmail,
          ownerFirstName,
          ownerLastName,
          planName: updatedOrg!.planName || '',
          planStartDate: updatedOrg!.planStartDate || null,
          planEndDate: updatedOrg!.planEndDate || null,
          createdAt: updatedOrg!.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating organization:', error);

    // Handle duplicate key errors (slug uniqueness)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Organization with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Soft delete organization
 * SuperAdmin only endpoint
 * 
 * Soft delete only:
 * - Sets deletedAt = new Date()
 * - Sets status = "inactive"
 * - Does NOT delete related data
 * - Organization becomes inaccessible
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Verify JWT
  // 2. Ensure isSystemAdmin === true
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    // Check if organization exists (including already soft-deleted ones for this check)
    const existingOrg = await organizationsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if already soft-deleted
    if (existingOrg.deletedAt) {
      return NextResponse.json(
        { error: 'Organization already deleted' },
        { status: 404 }
      );
    }

    // Soft delete: Set deletedAt and status to inactive
    const result = await organizationsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          deletedAt: new Date(),
          status: 'inactive',
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Organization soft deleted',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error soft deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}

