import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { userRolesServer, verifyToken, getOrgIdFromToken, requireOrgIdFromToken } from '../../helpers';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../lib/orgIdHelper';

// GET: Fetch all clients (filtered by organization)
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const clientsCollection = db.collection('clients');

    // Build query with org_id filter
    const query: any = addOrgIdToQuery({}, org_id);
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await clientsCollection.countDocuments(query);
    const skip = (page - 1) * limit;

    const clients = await clientsCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        clients: clients.map((c) => ({
          ...c,
          _id: c._id.toString(),
        })),
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
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST: Create new client (with org_id)
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const body = await request.json();
    const { name, email, phone, company, address, city, country, notes, projectName, photoUrl } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const clientsCollection = db.collection('clients');

    // Check if client exists in the same organization
    const existingClient = await clientsCollection.findOne(
      addOrgIdToQuery({ email }, org_id)
    );
    if (existingClient) {
      return NextResponse.json({ error: 'Client with this email already exists in your organization' }, { status: 400 });
    }

    // Create client with org_id
    const newClient = addOrgIdToDocument({
      name,
      email,
      phone: phone || '',
      company: company || '',
      address: address || '',
      city: city || '',
      country: country || '',
      notes: notes || '',
      projectName: projectName || '',
      photoUrl: photoUrl || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
    }, org_id);

    const result = await clientsCollection.insertOne(newClient);

    return NextResponse.json(
      {
        success: true,
        client: { ...newClient, _id: result.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

// PATCH: Update client (with org_id check)
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const body = await request.json();
    const { clientId, name, email, phone, company, address, city, country, notes, projectName, photoUrl } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const clientsCollection = db.collection('clients');

    // Verify client exists in the same organization
    const existingClient = await clientsCollection.findOne(
      addOrgIdToQuery({ _id: new ObjectId(clientId) }, org_id)
    );
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found in your organization' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (notes !== undefined) updateData.notes = notes;
    if (projectName !== undefined) updateData.projectName = projectName;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    const result = await clientsCollection.updateOne(
      addOrgIdToQuery({ _id: new ObjectId(clientId) }, org_id),
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE: Delete client (with org_id check)
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('_id');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const clientsCollection = db.collection('clients');

    // Verify client exists in the same organization
    const existingClient = await clientsCollection.findOne(
      addOrgIdToQuery({ _id: new ObjectId(clientId) }, org_id)
    );
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found in your organization' }, { status: 404 });
    }

    const result = await clientsCollection.deleteOne(
      addOrgIdToQuery({ _id: new ObjectId(clientId) }, org_id)
    );

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
