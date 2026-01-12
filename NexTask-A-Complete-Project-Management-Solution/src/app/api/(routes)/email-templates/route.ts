import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../../helpers';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';

// POST: Add a new email template
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();

    // Validate the request body
    const { name, description, htmlString, emailType } = body;
    if (!name || !description || !htmlString || !emailType) {
      return NextResponse.json(
        {
          error: 'All fields (name, description, htmlString, emailType) are required',
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const templatesCollection = db.collection('emailTemplates');

    // Check if a template with the same emailType already exists
    const existingTypeTemplate = await templatesCollection.findOne({
      emailType
    });
    if (existingTypeTemplate) {
      return NextResponse.json(
        {
          error: `An email template with the type "${emailType}" already exists`,
        },
        { status: 400 }
      );
    }

    // Insert the new template
    const result = await templatesCollection.insertOne({
      name,
      description,
      htmlString,
      emailType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email template created successfully',
        template: {
          _id: result.insertedId.toString(),
          name,
          description,
          htmlString,
          emailType,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 });
  }
}

// PUT: Update an existing email template
export async function PUT(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();

    // Validate the request body
    const { id, name, description, htmlString, emailType } = body;
    if (!id || !name || !description || !htmlString || !emailType) {
      return NextResponse.json(
        {
          error: 'All fields (id, name, description, htmlString, emailType) are required',
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const templatesCollection = db.collection('emailTemplates');

    // Verify template exists
    const existingTemplate = await templatesCollection.findOne({
      _id: new ObjectId(id)
    });
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    // Check if a template with the same emailType already exists (excluding the current template)
    const existingTypeTemplate = await templatesCollection.findOne({
      emailType,
      _id: { $ne: new ObjectId(id) }
    });
    if (existingTypeTemplate) {
      return NextResponse.json(
        {
          error: `An email template with the type "${emailType}" already exists`,
        },
        { status: 400 }
      );
    }

    // Update the template
    const result = await templatesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          description,
          htmlString,
          emailType,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email template updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
  }
}

// GET: Retrieve all email templates
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const templatesCollection = db.collection('emailTemplates');

    const templates = await templatesCollection.find({}).toArray();

    // Return minimal fields for list view - exclude htmlString (can be large)
    return NextResponse.json(
      {
        success: true,
        templates: templates.map((t) => ({
          _id: t._id.toString(),
          name: t.name,
          description: t.description,
          emailType: t.emailType,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          // Exclude htmlString - fetch only in detail view
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
  }
}

// DELETE: Delete email template
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const templatesCollection = db.collection('emailTemplates');

    // Verify template exists
    const existingTemplate = await templatesCollection.findOne({
      _id: new ObjectId(id)
    });
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    const result = await templatesCollection.deleteOne({ 
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Email template deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    return NextResponse.json({ error: 'Failed to delete email template' }, { status: 500 });
  }
}
