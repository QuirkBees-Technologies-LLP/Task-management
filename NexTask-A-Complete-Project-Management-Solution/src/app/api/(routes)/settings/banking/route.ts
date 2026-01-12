import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifyToken, userRolesServer, getOrgIdFromToken, requireOrgIdFromToken } from '../../../helpers';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../../lib/orgIdHelper';

// GET: Fetch banking details (filtered by organization)
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
    const bankingDetailsCollection = db.collection('bankingDetails');

    // Fetch banking details for the user's organization
    const bankingDetails = await bankingDetailsCollection.findOne(
      addOrgIdToQuery({}, org_id)
    );

    if (!bankingDetails) {
      // Return empty/default settings if none exist
      return NextResponse.json(
        {
          success: true,
          settings: {
            accountHolder: '',
            accountNumber: '',
            bankName: '',
            accountType: '',
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        settings: {
          accountHolder: bankingDetails.accountHolder || '',
          accountNumber: bankingDetails.accountNumber || '',
          bankName: bankingDetails.bankName || '',
          accountType: bankingDetails.accountType || '',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching banking details:', error);
    return NextResponse.json({ error: 'Failed to fetch banking details' }, { status: 500 });
  }
}

// PUT: Create or update banking details (admin only, with org_id)
export async function PUT(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const body = await request.json();
    const { accountHolder, accountNumber, bankName, accountType } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const bankingDetailsCollection = db.collection('bankingDetails');

    // Check if settings already exist for this organization
    const existingSettings = await bankingDetailsCollection.findOne(
      addOrgIdToQuery({}, org_id)
    );

    const settingsData = {
      accountHolder: accountHolder || '',
      accountNumber: accountNumber || '',
      bankName: bankName || '',
      accountType: accountType || '',
      updatedAt: new Date(),
    };

    let result;
    if (existingSettings) {
      // Update existing document for this organization
      result = await bankingDetailsCollection.updateOne(
        addOrgIdToQuery({ _id: existingSettings._id }, org_id),
        { $set: settingsData }
      );
    } else {
      // Create new document with org_id
      const newSettings = addOrgIdToDocument({
        ...settingsData,
        createdAt: new Date(),
      }, org_id);
      result = await bankingDetailsCollection.insertOne(newSettings);
    }

    return NextResponse.json(
      {
        success: true,
        message: existingSettings
          ? 'Banking details updated successfully'
          : 'Banking details created successfully',
        settings: {
          ...settingsData,
          _id: existingSettings ? existingSettings._id.toString() : result.insertedId.toString(),
        },
      },
      { status: existingSettings ? 200 : 201 }
    );
  } catch (error: any) {
    console.error('Error saving banking details:', error);
    return NextResponse.json({ error: 'Failed to save banking details' }, { status: 500 });
  }
}

