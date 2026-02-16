import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, senderEmail, tokenExpiryLong } from '../../../config';
import { verifySystemAdmin, userRolesServer } from '../../../helpers';
import { ensureOrganizationIndexes, validateSlug, normalizeSlug } from '../../../lib/organizations';
import { resolvePlanNameToId, resolvePlanSearchToIds } from '../../../lib/planResolver';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../../lib/email';
import { emailTemplateVariables } from '@/utils/constants';

// GET: Fetch all organizations (SuperAdmin only)
export async function GET(request: Request) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const planSearch = searchParams.get('planSearch') || '';
    const statusFilter = searchParams.get('status') || '';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');
    const usersCollection = db.collection('users');

    // Build query
    const query: any = { deletedAt: null };
    
    if (search) {
      const searchConditions: any[] = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ];
      
      const matchingOwners = await usersCollection
        .find({
          $or: [
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
          ],
        })
        .project({ _id: 1 })
        .toArray();
      
      if (matchingOwners.length > 0) {
        const ownerIds = matchingOwners.map((owner) => owner._id);
        searchConditions.push({ ownerId: { $in: ownerIds } });
      }
      
      query.$or = searchConditions;
    }

    if (planSearch) {
      const planIds = await resolvePlanSearchToIds(planSearch);
      if (planIds.length === 0) {
        return NextResponse.json(
          {
            success: true,
            organizations: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
          { status: 200 }
        );
      }
      query.planId = { $in: planIds };
    }
    
    if (statusFilter) {
      query.status = statusFilter;
    }

    const total = await organizationsCollection.countDocuments(query);
    const skip = (page - 1) * limit;

    const organizations = await organizationsCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Populate owner information
    const organizationsWithOwner = await Promise.all(
      organizations.map(async (org) => {
        let ownerInfo = null;
        if (org.ownerId) {
          const owner = await usersCollection.findOne({ _id: new ObjectId(org.ownerId) });
          if (owner) {
            ownerInfo = {
              _id: owner._id.toString(),
              firstName: owner.firstName || '',
              lastName: owner.lastName || '',
              email: owner.email || '',
            };
          }
        }
        return {
          ...org,
          _id: org._id.toString(),
          ownerId: org.ownerId ? org.ownerId.toString() : null,
          planId: org.planId ? org.planId.toString() : null,
          planName: org.planName || '',
          owner: ownerInfo,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        organizations: organizationsWithOwner,
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
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

// POST: Create new organization (SuperAdmin only)
export async function POST(request: Request) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const body = await request.json();
    const {
      name,
      slug,
      status: orgStatus,
      ownerName, // Support old format
      ownerEmail, // Support old format
      owner, // Support new format from master-admin frontend
      planId, // Accept planId directly
      planName, // Accept planName (will be resolved to planId)
      planStartDate,
      planEndDate,
    } = body;

    // Handle both formats: { ownerName, ownerEmail } OR { owner: { firstName, lastName, email, password } }
    let finalOwnerName: string;
    let finalOwnerEmail: string;
    let ownerPassword: string | undefined;

    if (owner && typeof owner === 'object') {
      // New format: owner object with firstName, lastName, email, password
      if (!owner.firstName || !owner.lastName || !owner.email) {
        return NextResponse.json(
          { error: 'Owner firstName, lastName, and email are required' },
          { status: 400 }
        );
      }
      finalOwnerName = `${owner.firstName} ${owner.lastName}`.trim();
      finalOwnerEmail = owner.email;
      ownerPassword = owner.password; // Optional - will generate if not provided
    } else {
      // Old format: ownerName and ownerEmail directly
      if (!ownerName || !ownerEmail) {
        return NextResponse.json(
          { error: 'Name, slug, owner name, and owner email are required' },
          { status: 400 }
        );
      }
      finalOwnerName = ownerName;
      finalOwnerEmail = ownerEmail;
    }

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Organization name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalOwnerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const normalizedSlug = normalizeSlug(slug);
    if (!validateSlug(normalizedSlug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens (max 50 characters)' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');
    const usersCollection = db.collection('users');
    const emailTemplatesCollection = db.collection('emailTemplates');

    const existingOrg = await organizationsCollection.findOne({
      slug: normalizedSlug,
      deletedAt: null,
    });
    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with this slug already exists' },
        { status: 400 }
      );
    }

    const existingUser = await usersCollection.findOne({ email: finalOwnerEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Use provided password or generate a temporary one
    const tempPassword = ownerPassword || (Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase());
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // IMPORTANT: Owner must have role 'Admin' (not 'ORG_ADMIN' or any other value)
    // This is the standard admin role used throughout the system
    // We explicitly use 'Admin' string to ensure consistency
    // CRITICAL: Do not use any other role value - must be exactly 'Admin'
    const ADMIN_ROLE = 'Admin'; // Define as constant to prevent typos
    const ownerUser = {
      firstName: finalOwnerName.split(' ')[0] || finalOwnerName,
      lastName: finalOwnerName.split(' ').slice(1).join(' ') || '',
      email: finalOwnerEmail,
      password: hashedPassword,
      role: ADMIN_ROLE, // MUST be 'Admin' - no other value is acceptable
      isTemporaryPassword: !ownerPassword, // Only temporary if password was auto-generated
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Double-check the role is correct before proceeding
    if (ownerUser.role !== 'Admin') {
      console.error('CRITICAL ERROR: ownerUser.role is not "Admin"! Value:', ownerUser.role);
      return NextResponse.json(
        { error: 'Internal error: Invalid role assignment' },
        { status: 500 }
      );
    }

    console.log('Creating owner user with role: Admin for email:', finalOwnerEmail);

    let ownerId: ObjectId;
    let ownerResult;

    try {
      // Log what we're about to insert
      console.log('About to create owner user with role:', ownerUser.role, 'for email:', finalOwnerEmail);
      
      ownerResult = await usersCollection.insertOne(ownerUser);
      ownerId = ownerResult.insertedId;
      
      // Immediately verify the role was set correctly - must be exactly 'Admin'
      const verifyOwner = await usersCollection.findOne({ _id: ownerId });
      console.log('User created. Verifying role. Found role in DB:', verifyOwner?.role);
      
      if (!verifyOwner) {
        console.error('CRITICAL: Owner user was not found after creation!');
        return NextResponse.json(
          { error: 'Failed to create owner user' },
          { status: 500 }
        );
      }
      
      if (verifyOwner.role !== 'Admin') {
        console.error('ERROR: Owner role was not set correctly! Expected "Admin", got:', verifyOwner.role);
        console.error('Full user object:', JSON.stringify(verifyOwner, null, 2));
        // Fix it immediately - set to 'Admin'
        const fixResult = await usersCollection.updateOne(
          { _id: ownerId },
          { $set: { role: 'Admin' } }
        );
        console.log('Role fix update result:', fixResult);
        
        // Verify again after fix
        const verifyAfterFix = await usersCollection.findOne({ _id: ownerId });
        console.log('Role after fix:', verifyAfterFix?.role);
        
        if (verifyAfterFix && verifyAfterFix.role !== 'Admin') {
          console.error('CRITICAL: Role fix failed! Role is still:', verifyAfterFix.role);
          return NextResponse.json(
            { error: 'Failed to set owner role to Admin' },
            { status: 500 }
          );
        }
      } else {
        console.log('✓ Owner role verified correctly as "Admin"');
      }
    } catch (userError: any) {
      console.error('Error creating owner user:', userError);
      return NextResponse.json(
        { error: 'Failed to create owner user' },
        { status: 500 }
      );
    }

    let resolvedPlanId: ObjectId | null = null;
    let resolvedPlanName = '';
    
    // Handle planId or planName - planId takes precedence
    if (planId) {
      // If planId is provided directly, validate it and get plan name
      try {
        if (!ObjectId.isValid(planId)) {
          await usersCollection.deleteOne({ _id: ownerId });
          return NextResponse.json(
            { error: 'Invalid planId format' },
            { status: 400 }
          );
        }
        
        const plansCollection = db.collection('plans');
        const planDoc = await plansCollection.findOne({
          _id: new ObjectId(planId),
          status: 'active',
          deletedAt: null,
        });
        
        if (!planDoc) {
          await usersCollection.deleteOne({ _id: ownerId });
          return NextResponse.json(
            { error: 'Plan not found or inactive for the provided planId' },
            { status: 400 }
          );
        }
        
        resolvedPlanId = planDoc._id;
        resolvedPlanName = planDoc.plan_name || '';
      } catch (planError: any) {
        await usersCollection.deleteOne({ _id: ownerId });
        return NextResponse.json(
          { error: planError.message || 'Failed to validate plan' },
          { status: 400 }
        );
      }
    } else if (planName && typeof planName === 'string' && planName.trim() !== '') {
      // If planName is provided, resolve it to planId
      try {
        const planResolution = await resolvePlanNameToId(planName);
        resolvedPlanId = planResolution.planId;
        resolvedPlanName = planResolution.resolvedPlanName;
      } catch (planError: any) {
        await usersCollection.deleteOne({ _id: ownerId });
        return NextResponse.json(
          { error: planError.message || 'Failed to resolve plan' },
          { status: 400 }
        );
      }
    }

    const newOrganization = {
      name,
      slug: normalizedSlug,
      slug_history: [normalizedSlug],
      status: orgStatus || 'active',
      ownerId,
      planId: resolvedPlanId,
      planName: resolvedPlanName,
      planStartDate: planStartDate ? new Date(planStartDate) : null,
      planEndDate: planEndDate ? new Date(planEndDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    let result;
    try {
      result = await organizationsCollection.insertOne(newOrganization);
    } catch (orgError: any) {
      await usersCollection.deleteOne({ _id: ownerId });
      console.error('Error creating organization:', orgError);
      if (orgError.code === 11000) {
        return NextResponse.json(
          { error: 'Organization with this slug already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    try {
      // IMPORTANT: Only update org_id fields, DO NOT overwrite role
      // Use $set to add fields without affecting existing ones like role
      console.log('Updating owner with org_id. Owner ID:', ownerId.toString());
      const updateResult = await usersCollection.updateOne(
        { _id: ownerId },
        { $set: { 
          organizationId: result.insertedId,
          org_id: result.insertedId  // Set org_id for organization scoping
          // NOTE: We explicitly do NOT set role here to avoid overwriting it
        } }
      );
      console.log('Update result:', updateResult);
      
      // Verify role is still correct after update - must be exactly 'Admin'
      const verifyAfterUpdate = await usersCollection.findOne({ _id: ownerId });
      console.log('Role after org_id update:', verifyAfterUpdate?.role);
      
      if (!verifyAfterUpdate) {
        console.error('CRITICAL: Owner user not found after org_id update!');
      } else if (verifyAfterUpdate.role !== 'Admin') {
        console.error('CRITICAL: Role was lost after org_id update! Fixing...', {
          email: verifyAfterUpdate.email,
          currentRole: verifyAfterUpdate.role,
          expectedRole: 'Admin',
          fullUser: JSON.stringify(verifyAfterUpdate, null, 2)
        });
        // Fix it immediately - set to 'Admin'
        const fixResult = await usersCollection.updateOne(
          { _id: ownerId },
          { $set: { role: 'Admin' } }
        );
        console.log('Role fix result:', fixResult);
        
        // Final verification
        const finalVerify = await usersCollection.findOne({ _id: ownerId });
        console.log('Final role verification:', finalVerify?.role);
        
        if (finalVerify && finalVerify.role !== 'Admin') {
          console.error('CRITICAL: Role fix failed! Final role:', finalVerify.role);
        } else {
          console.log('✓ Role successfully fixed to "Admin"');
        }
      } else {
        console.log('✓ Role remains "Admin" after org_id update');
      }
    } catch (updateError) {
      console.error('Error updating owner with organization ID:', updateError);
    }

    try {
      const invTemplate = await emailTemplatesCollection.findOne({
        emailType: 'invite',
      });

      if (invTemplate) {
        const baseUrl = `${request.headers.get('origin')}`;
        const token = jwt.sign(
          {
            id: ownerId,
            email: finalOwnerEmail,
            password: tempPassword,
          },
          JWT_SECRET,
          {
            expiresIn: tokenExpiryLong,
          }
        );
        const inviteLink = `${baseUrl}/change-password?token=${token}`;

        const emailHtml = invTemplate.htmlString
          .replace(emailTemplateVariables.name, `${ownerUser.firstName} ${ownerUser.lastName}`)
          .replace(emailTemplateVariables.email, finalOwnerEmail)
          .replace(emailTemplateVariables.password, tempPassword)
          .replace(emailTemplateVariables.btnLink, inviteLink);

        await sendEmail({
          to: finalOwnerEmail,
          subject: `Welcome to ${name} - Set Your Password`,
          html: emailHtml,
          from: senderEmail ?? 'default@gmail.com',
        });
      }
    } catch (emailError) {
      console.error('Error sending invite email:', emailError);
    }

    try {
      await ensureOrganizationIndexes();
    } catch (indexError) {
      console.warn('Error ensuring indexes:', indexError);
    }

    // Final verification before returning - ensure owner has correct role 'Admin'
    const finalOwnerCheck = await usersCollection.findOne({ _id: ownerId });
    if (finalOwnerCheck) {
      console.log('=== FINAL ROLE VERIFICATION ===');
      console.log('Owner email:', finalOwnerCheck.email);
      console.log('Current role in DB:', finalOwnerCheck.role);
      console.log('Role type:', typeof finalOwnerCheck.role);
      console.log('Role === "Admin":', finalOwnerCheck.role === 'Admin');
      
      if (finalOwnerCheck.role !== 'Admin') {
        console.error('❌ CRITICAL: Owner role is NOT "Admin" in final check!');
        console.error('   Expected: "Admin"');
        console.error('   Got:', finalOwnerCheck.role);
        console.error('   Full user object:', JSON.stringify(finalOwnerCheck, null, 2));
        
        // Last chance fix - force set to 'Admin'
        const finalFixResult = await usersCollection.updateOne(
          { _id: ownerId },
          { $set: { role: 'Admin' } }
        );
        console.log('Final fix update result:', finalFixResult);
        
        // Verify the fix worked
        const afterFinalFix = await usersCollection.findOne({ _id: ownerId });
        console.log('Role after final fix:', afterFinalFix?.role);
        
        if (afterFinalFix && afterFinalFix.role !== 'Admin') {
          console.error('❌❌❌ FINAL FIX FAILED! Role is still:', afterFinalFix.role);
          return NextResponse.json(
            { 
              error: 'Failed to set owner role to Admin. Please check database.',
              debug: {
                expectedRole: 'Admin',
                actualRole: afterFinalFix.role,
                ownerId: ownerId.toString()
              }
            },
            { status: 500 }
          );
        } else {
          console.log('✓ Final fix successful - role is now "Admin"');
        }
      } else {
        console.log('✓ Final verification passed - role is "Admin"');
      }
      console.log('=== END FINAL VERIFICATION ===');
    }

    return NextResponse.json(
      {
        success: true,
        organization: {
          ...newOrganization,
          _id: result.insertedId.toString(),
          ownerId: ownerId.toString(),
          planId: resolvedPlanId ? resolvedPlanId.toString() : null,
          planName: resolvedPlanName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating organization:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Organization with this slug already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

