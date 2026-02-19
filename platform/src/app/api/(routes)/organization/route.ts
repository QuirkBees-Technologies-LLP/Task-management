import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, requireOrgIdFromToken, getOrgIdFromToken } from '../../helpers';
import { addOrgIdToQuery } from '../../lib/orgIdHelper';

// GET: Fetch current organization details with stats
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');
    const projectsCollection = db.collection('projects');
    const usersCollection = db.collection('users');

    // Fetch organization details
    const organization = await organizationsCollection.findOne({
      _id: org_id,
      deletedAt: null,
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch owner information
    let ownerInfo = null;
    if (organization.ownerId) {
      const owner = await usersCollection.findOne({ _id: new ObjectId(organization.ownerId) });
      if (owner) {
        ownerInfo = {
          _id: owner._id.toString(),
          firstName: owner.firstName || '',
          lastName: owner.lastName || '',
          email: owner.email || '',
        };
      }
    }

    // Count projects in the organization
    const projectCount = await projectsCollection.countDocuments(
      addOrgIdToQuery({}, org_id)
    );

    // Count staff (users) in the organization
    const staffCount = await usersCollection.countDocuments(
      addOrgIdToQuery({}, org_id)
    );

    // Helper function to safely convert dates
    const safeDate = (date: any): string | null => {
      if (!date) return null;
      try {
        const d = date instanceof Date ? date : new Date(date);
        // Check if date is valid and not epoch
        if (isNaN(d.getTime()) || d.getTime() === 0) return null;
        // Check if date is epoch (January 1, 1970)
        if (d.getFullYear() === 1970 && d.getMonth() === 0 && d.getDate() === 1) return null;
        return d.toISOString();
      } catch {
        return null;
      }
    };

    // Format organization response
    const organizationResponse = {
      _id: organization._id.toString(),
      name: organization.name || '',
      slug: organization.slug || '',
      status: organization.status || 'active',
      planId: organization.planId ? organization.planId.toString() : null,
      planName: organization.planName || '',
      planStartDate: safeDate(organization.planStartDate),
      planEndDate: safeDate(organization.planEndDate),
      trialStartDate: safeDate(organization.trialStartDate),
      trialEndDate: safeDate(organization.trialEndDate),
      createdAt: safeDate(organization.createdAt),
      updatedAt: safeDate(organization.updatedAt),
      owner: ownerInfo,
      stats: {
        projectCount,
        staffCount,
      },
    };

    return NextResponse.json(
      {
        success: true,
        organization: organizationResponse,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching organization details:', error);
    return NextResponse.json({ error: 'Failed to fetch organization details' }, { status: 500 });
  }
}

// PATCH: Update current organization details
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    // Check if organization exists
    const existingOrg = await organizationsCollection.findOne({
      _id: org_id,
      deletedAt: null,
    });

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Validate and update name if provided
    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length < 2 || body.name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Organization name must be between 2 and 100 characters' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    // Update planName if provided (resolve to planId)
    if (body.planName !== undefined) {
      const { resolvePlanNameToId } = await import('../../lib/planResolver');
      if (body.planName === null || body.planName === '' || (typeof body.planName === 'string' && body.planName.trim() === '')) {
        // Clear plan if empty/null
        updateData.planId = null;
        updateData.planName = '';
      } else {
        try {
          const planResolution = await resolvePlanNameToId(body.planName);
          updateData.planId = planResolution.planId;
          updateData.planName = planResolution.resolvedPlanName;
        } catch (planError: any) {
          return NextResponse.json(
            { error: planError.message || 'Failed to resolve plan' },
            { status: 400 }
          );
        }
      }
    }

    // Update plan dates if provided
    if (body.planStartDate !== undefined) {
      updateData.planStartDate = body.planStartDate ? new Date(body.planStartDate) : null;
    }
    if (body.planEndDate !== undefined) {
      updateData.planEndDate = body.planEndDate ? new Date(body.planEndDate) : null;
    }

    // Update trial dates if provided
    if (body.trialStartDate !== undefined) {
      updateData.trialStartDate = body.trialStartDate ? new Date(body.trialStartDate) : null;
    }
    if (body.trialEndDate !== undefined) {
      updateData.trialEndDate = body.trialEndDate ? new Date(body.trialEndDate) : null;
    }

    const result = await organizationsCollection.updateOne(
      { _id: org_id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch updated organization with stats
    const updatedOrg = await organizationsCollection.findOne({ _id: org_id });
    const projectsCollection = db.collection('projects');
    const usersCollection = db.collection('users');

    // Count projects and staff
    const projectCount = await projectsCollection.countDocuments(
      addOrgIdToQuery({}, org_id)
    );
    const staffCount = await usersCollection.countDocuments(
      addOrgIdToQuery({}, org_id)
    );

    // Fetch owner information
    let ownerInfo = null;
    if (updatedOrg?.ownerId) {
      const owner = await usersCollection.findOne({ _id: new ObjectId(updatedOrg.ownerId) });
      if (owner) {
        ownerInfo = {
          _id: owner._id.toString(),
          firstName: owner.firstName || '',
          lastName: owner.lastName || '',
          email: owner.email || '',
        };
      }
    }

    // Helper function to safely convert dates
    const safeDate = (date: any): string | null => {
      if (!date) return null;
      try {
        const d = date instanceof Date ? date : new Date(date);
        // Check if date is valid and not epoch
        if (isNaN(d.getTime()) || d.getTime() === 0) return null;
        // Check if date is epoch (January 1, 1970)
        if (d.getFullYear() === 1970 && d.getMonth() === 0 && d.getDate() === 1) return null;
        return d.toISOString();
      } catch {
        return null;
      }
    };

    return NextResponse.json(
      {
        success: true,
        organization: {
          _id: updatedOrg!._id.toString(),
          name: updatedOrg!.name || '',
          slug: updatedOrg!.slug || '',
          status: updatedOrg!.status || 'active',
          planId: updatedOrg!.planId ? updatedOrg!.planId.toString() : null,
          planName: updatedOrg!.planName || '',
          planStartDate: safeDate(updatedOrg!.planStartDate),
          planEndDate: safeDate(updatedOrg!.planEndDate),
          trialStartDate: safeDate(updatedOrg!.trialStartDate),
          trialEndDate: safeDate(updatedOrg!.trialEndDate),
          createdAt: safeDate(updatedOrg!.createdAt),
          updatedAt: safeDate(updatedOrg!.updatedAt),
          owner: ownerInfo,
          stats: {
            projectCount,
            staffCount,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}

