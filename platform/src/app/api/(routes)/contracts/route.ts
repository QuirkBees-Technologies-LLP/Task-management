import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, getOrgIdFromToken, requireOrgIdFromToken } from '../../helpers';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../lib/orgIdHelper';

// GET: Fetch all contracts (filtered by organization)
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
    const status = searchParams.get('status') || '';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const contractsCollection = db.collection('contracts');

    // Build query with org_id filter
    const query: any = addOrgIdToQuery({}, org_id);
    if (search) {
      query.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const total = await contractsCollection.countDocuments(query);
    const skip = (page - 1) * limit;

    const contracts = await contractsCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        contracts: contracts.map((c) => ({
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
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

// POST: Create new contract (with org_id)
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const body = await request.json();
    const { contractNumber, title, clientName, clientEmail, startDate, endDate, value, status: contractStatus, terms, description } = body;

    if (!contractNumber || !title || !clientName || !startDate) {
      return NextResponse.json(
        { error: 'Contract number, title, client name, and start date are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const contractsCollection = db.collection('contracts');

    // Check if contract number exists in the same organization
    const existingContract = await contractsCollection.findOne(
      addOrgIdToQuery({ contractNumber }, org_id)
    );
    if (existingContract) {
      return NextResponse.json({ error: 'Contract number already exists in your organization' }, { status: 400 });
    }

    // Create contract with org_id
    const newContract = addOrgIdToDocument({
      contractNumber,
      title,
      clientName,
      clientEmail: clientEmail || '',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      value: value ? parseFloat(value) : 0,
      status: contractStatus || 'draft',
      terms: terms || '',
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id,
    }, org_id);

    const result = await contractsCollection.insertOne(newContract);

    return NextResponse.json(
      {
        success: true,
        contract: { ...newContract, _id: result.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}

// PATCH: Update contract (with org_id check)
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const body = await request.json();
    const { contractId, contractNumber, title, clientName, clientEmail, startDate, endDate, value, status: contractStatus, terms, description } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const contractsCollection = db.collection('contracts');

    // Verify contract exists in the same organization
    const existingContract = await contractsCollection.findOne(
      addOrgIdToQuery({ _id: new ObjectId(contractId) }, org_id)
    );
    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found in your organization' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (contractNumber) updateData.contractNumber = contractNumber;
    if (title) updateData.title = title;
    if (clientName) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = endDate ? new Date(endDate) : null;
    if (value !== undefined) updateData.value = parseFloat(value);
    if (contractStatus) updateData.status = contractStatus;
    if (terms !== undefined) updateData.terms = terms;
    if (description !== undefined) updateData.description = description;

    const result = await contractsCollection.updateOne(
      addOrgIdToQuery({ _id: new ObjectId(contractId) }, org_id),
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Contract updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

// DELETE: Delete contract (with org_id check)
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('_id');

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const contractsCollection = db.collection('contracts');

    // Verify contract exists in the same organization
    const existingContract = await contractsCollection.findOne(
      addOrgIdToQuery({ _id: new ObjectId(contractId) }, org_id)
    );
    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found in your organization' }, { status: 404 });
    }

    const result = await contractsCollection.deleteOne(
      addOrgIdToQuery({ _id: new ObjectId(contractId) }, org_id)
    );

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Contract deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}

