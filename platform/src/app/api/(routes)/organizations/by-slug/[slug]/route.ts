import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';

// GET: Get organization by slug (Public endpoint for routing)
// This endpoint is used to resolve slug to org_id for routing
export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params;

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DATABASE_NAME);
        const organizationsCollection = db.collection('organizations');

        const organization = await organizationsCollection.findOne({
            slug,
            deletedAt: null,
            status: 'active', // Only return active organizations
        });

        if (!organization) {
            return NextResponse.json(
                { error: 'Organization not found or inactive' },
                { status: 404 }
            );
        }

        // Return only essential information for routing
        return NextResponse.json(
            {
                success: true,
                organization: {
                    _id: organization._id.toString(), // This is the org_id
                    name: organization.name,
                    slug: organization.slug,
                    status: organization.status,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error fetching organization by slug:', error);
        return NextResponse.json(
            { error: 'Failed to fetch organization' },
            { status: 500 }
        );
    }
}

