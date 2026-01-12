import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifyToken, userRolesServer, getOrgIdFromToken, requireOrgIdFromToken } from '../../../helpers';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../../lib/orgIdHelper';

// GET: Fetch company settings (filtered by organization)
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token for organization scoping
    const org_id = getOrgIdFromToken(decoded);
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const companySettingsCollection = db.collection('companySettings');

    // Fetch settings for the user's organization
    const companySettings = await companySettingsCollection.findOne(
      addOrgIdToQuery({}, org_id)
    );

    if (!companySettings) {
      // Return empty/default settings if none exist
      return NextResponse.json(
        {
          success: true,
          settings: {
            companyName: '',
            logoUrl: '',
            address: '',
            email: '',
            phone: '',
            taxNumber: '',
            website: '',
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        settings: {
          companyName: companySettings.companyName || '',
          logoUrl: companySettings.logoUrl || '',
          address: companySettings.address || '',
          email: companySettings.email || '',
          phone: companySettings.phone || '',
          taxNumber: companySettings.taxNumber || '',
          website: companySettings.website || '',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json({ error: 'Failed to fetch company settings' }, { status: 500 });
  }
}

// PUT: Create or update company settings (admin only, with org_id)
export async function PUT(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const body = await request.json();
    const { companyName, logoUrl, address, email, phone, taxNumber, website } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const companySettingsCollection = db.collection('companySettings');

    // Check if settings already exist for this organization
    const existingSettings = await companySettingsCollection.findOne(
      addOrgIdToQuery({}, org_id)
    );

    const settingsData = {
      companyName: companyName || '',
      logoUrl: logoUrl || '',
      address: address || '',
      email: email || '',
      phone: phone || '',
      taxNumber: taxNumber || '',
      website: website || '',
      updatedAt: new Date(),
    };

    let result;
    if (existingSettings) {
      // Update existing document for this organization
      result = await companySettingsCollection.updateOne(
        addOrgIdToQuery({ _id: existingSettings._id }, org_id),
        { $set: settingsData }
      );
    } else {
      // Create new document with org_id
      const newSettings = addOrgIdToDocument({
        ...settingsData,
        createdAt: new Date(),
      }, org_id);
      result = await companySettingsCollection.insertOne(newSettings);
    }

    return NextResponse.json(
      {
        success: true,
        message: existingSettings
          ? 'Company settings updated successfully'
          : 'Company settings created successfully',
        settings: {
          ...settingsData,
          _id: existingSettings ? existingSettings._id.toString() : result.insertedId.toString(),
        },
      },
      { status: existingSettings ? 200 : 201 }
    );
  } catch (error: any) {
    console.error('Error saving company settings:', error);
    return NextResponse.json({ error: 'Failed to save company settings' }, { status: 500 });
  }
}

