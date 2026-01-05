import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifyToken, userRolesServer } from '../../../helpers';

// GET: Fetch banking details (allowed for all logged-in users)
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const bankingDetailsCollection = db.collection('bankingDetails');

    // There should be only one document
    const bankingDetails = await bankingDetailsCollection.findOne({});

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

// PUT: Create or update banking details (admin only)
export async function PUT(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { accountHolder, accountNumber, bankName, accountType } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const bankingDetailsCollection = db.collection('bankingDetails');

    // Check if settings already exist
    const existingSettings = await bankingDetailsCollection.findOne({});

    const settingsData = {
      accountHolder: accountHolder || '',
      accountNumber: accountNumber || '',
      bankName: bankName || '',
      accountType: accountType || '',
      updatedAt: new Date(),
    };

    let result;
    if (existingSettings) {
      // Update existing document
      result = await bankingDetailsCollection.updateOne(
        { _id: existingSettings._id },
        { $set: settingsData }
      );
    } else {
      // Create new document (there should be only one)
      settingsData['createdAt'] = new Date();
      result = await bankingDetailsCollection.insertOne(settingsData);
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

