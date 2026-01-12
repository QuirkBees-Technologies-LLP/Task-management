import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, userRolesServer } from '../../helpers';

// GET: Fetch all settings
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const settingsCollection = db.collection('settings');

    // Get all settings
    const settings = await settingsCollection.find({}).toArray();

    // Convert to key-value object
    const settingsObj: any = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    return NextResponse.json(
      {
        success: true,
        settings: settingsObj,
        settingsList: settings.map((s) => ({
          ...s,
          _id: s._id.toString(),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST: Create/Update setting
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { key, value, type, description, category } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const settingsCollection = db.collection('settings');

    // Check if setting exists
    const existingSetting = await settingsCollection.findOne({
      key
    });

    const settingData = {
      key,
      value,
      type: type || 'string',
      description: description || '',
      category: category || 'general',
      updatedAt: new Date(),
      updatedBy: decoded.id,
    };

    let result;
    if (existingSetting) {
      // Update existing
      result = await settingsCollection.updateOne(
        { key },
        { $set: settingData }
      );
    } else {
      // Create new
      settingData['createdAt'] = new Date();
      result = await settingsCollection.insertOne(settingData);
    }

    return NextResponse.json(
      {
        success: true,
        message: existingSetting ? 'Setting updated successfully' : 'Setting created successfully',
      },
      { status: existingSetting ? 200 : 201 }
    );
  } catch (error: any) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}

// PATCH: Update multiple settings
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { settings } = body; // Array of { key, value } objects

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings array is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const settingsCollection = db.collection('settings');

    const updatePromises = settings.map(async (setting: any) => {
      if (!setting.key || setting.value === undefined) return null;

      return settingsCollection.updateOne(
        { key: setting.key },
        {
          $set: {
            value: setting.value,
            updatedAt: new Date(),
            updatedBy: decoded.id,
          },
        },
        { upsert: true }
      );
    });

    await Promise.all(updatePromises.filter(Boolean));

    return NextResponse.json({ success: true, message: 'Settings updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// DELETE: Delete setting
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const settingsCollection = db.collection('settings');

    const result = await settingsCollection.deleteOne({
      key
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Setting deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 });
  }
}

