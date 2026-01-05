import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { verifyToken, getOrgIdFromToken, verifySystemAdmin } from '../../../helpers';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';

// GET: Retrieve a single email template with full details (including htmlString)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const templateId = params?.id;
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

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
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const templatesCollection = db.collection('emailTemplates');

    // Build query with org_id filter if not system admin
    const query: any = { _id: new ObjectId(templateId) };
    if (org_id) {
      query.org_id = org_id;
    }

    const template = await templatesCollection.findOne(query);

    if (!template) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    // Return full template including htmlString
    return NextResponse.json(
      {
        success: true,
        template: {
          ...template,
          _id: template._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

