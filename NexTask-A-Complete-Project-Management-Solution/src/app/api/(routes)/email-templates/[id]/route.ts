import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../../../helpers';
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

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const templatesCollection = db.collection('emailTemplates');

    // Build query
    const query: any = { _id: new ObjectId(templateId) };

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

