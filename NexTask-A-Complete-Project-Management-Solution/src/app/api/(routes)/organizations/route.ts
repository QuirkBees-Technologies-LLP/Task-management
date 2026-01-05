import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, senderEmail, tokenExpiryLong } from '../../config';
import { verifyToken, userRolesServer } from '../../helpers';
import { ensureOrganizationIndexes, validateSlug, normalizeSlug } from '../../lib/organizations';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../lib/email';
import { emailTemplateVariables } from '@/utils/constants';

// GET: Fetch all organizations (Admin only)
export async function GET(request: Request) {
    const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
    if (error) return NextResponse.json({ error }, { status });

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const search = searchParams.get('search') || '';
        const statusFilter = searchParams.get('status') || '';

        const client = await clientPromise;
        const db = client.db(DATABASE_NAME);
        const organizationsCollection = db.collection('organizations');

        // Build query
        const query: any = { deletedAt: null }; // Only non-deleted organizations
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
            ];
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
        const usersCollection = db.collection('users');
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

// POST: Create new organization (Admin only)
export async function POST(request: Request) {
    const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
    if (error) return NextResponse.json({ error }, { status });

    try {
        const body = await request.json();
        const {
            name,
            slug,
            status: orgStatus,
            ownerName,
            ownerEmail,
            planName,
            planStartDate,
            planEndDate,
        } = body;

        // Validation
        if (!name || !slug || !ownerName || !ownerEmail) {
            return NextResponse.json(
                { error: 'Name, slug, owner name, and owner email are required' },
                { status: 400 }
            );
        }

        // Validate name length
        if (name.length < 2 || name.length > 100) {
            return NextResponse.json(
                { error: 'Organization name must be between 2 and 100 characters' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(ownerEmail)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Normalize and validate slug
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

        // Check if slug already exists
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

        // Check if owner email already exists
        const existingUser = await usersCollection.findOne({ email: ownerEmail });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Generate a temporary password for the owner
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create owner user first
        const ownerUser = {
            firstName: ownerName.split(' ')[0] || ownerName,
            lastName: ownerName.split(' ').slice(1).join(' ') || '',
            email: ownerEmail,
            password: hashedPassword,
            role: userRolesServer.admin,
            isTemporaryPassword: true,
            isEmailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        let ownerId: ObjectId;
        let ownerResult;

        try {
            ownerResult = await usersCollection.insertOne(ownerUser);
            ownerId = ownerResult.insertedId;
        } catch (userError: any) {
            console.error('Error creating owner user:', userError);
            return NextResponse.json(
                { error: 'Failed to create owner user' },
                { status: 500 }
            );
        }

        // Create the organization
        // Note: _id will be auto-generated by MongoDB and serves as org_id
        const newOrganization = {
            name,
            slug: normalizedSlug,
            slug_history: [normalizedSlug], // Track slug history
            status: orgStatus || 'active',
            ownerId,
            planName: planName || '',
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
            // If organization creation fails, clean up the owner user
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

        // Update owner user with organization reference (for future use)
        try {
            await usersCollection.updateOne(
                { _id: ownerId },
                { $set: { organizationId: result.insertedId } }
            );
        } catch (updateError) {
            // Log but don't fail - organization is already created
            console.error('Error updating owner with organization ID:', updateError);
        }

        // Send invite email to owner
        try {
            const invTemplate = await emailTemplatesCollection.findOne({
                emailType: 'invite',
            });

            if (invTemplate) {
                const baseUrl = `${request.headers.get('origin')}`;
                const token = jwt.sign(
                    {
                        id: ownerId,
                        email: ownerEmail,
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
                    .replace(emailTemplateVariables.email, ownerEmail)
                    .replace(emailTemplateVariables.password, tempPassword)
                    .replace(emailTemplateVariables.btnLink, inviteLink);

                await sendEmail({
                    to: ownerEmail,
                    subject: `Welcome to ${name} - Set Your Password`,
                    html: emailHtml,
                    from: senderEmail ?? 'default@gmail.com',
                });
            } else {
                console.warn('Invite email template not found - owner will need to reset password manually');
            }
        } catch (emailError) {
            // Log but don't fail - organization and user are already created
            console.error('Error sending invite email:', emailError);
        }

        // Ensure indexes exist (idempotent operation) - only on first creation
        // In production, this should be done via migration script, but keeping for safety
        try {
            await ensureOrganizationIndexes();
        } catch (indexError) {
            // Log but don't fail - indexes might already exist
            console.warn('Error ensuring indexes (this is usually safe to ignore):', indexError);
        }

        return NextResponse.json(
            {
                success: true,
                organization: {
                    ...newOrganization,
                    _id: result.insertedId.toString(),
                    ownerId: ownerId.toString(),
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating organization:', error);
        // If organization creation fails, clean up owner user if it was created
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


