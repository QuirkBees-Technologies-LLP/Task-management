import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken } from '../../helpers';

// GET: Fetch all contracts
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const contractsCollection = db.collection('contracts');

    const query: any = {};
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

// POST: Create new contract
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
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

    // Check if contract number exists
    const existingContract = await contractsCollection.findOne({
      contractNumber
    });
    if (existingContract) {
      return NextResponse.json({ error: 'Contract number already exists' }, { status: 400 });
    }

    const newContract = {
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
    };

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

// PATCH: Update contract
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { contractId, contractNumber, title, clientName, clientEmail, startDate, endDate, value, status: contractStatus, terms, description } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const contractsCollection = db.collection('contracts');

    // Verify contract exists
    const existingContract = await contractsCollection.findOne({
      _id: new ObjectId(contractId)
    });
    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
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
      { _id: new ObjectId(contractId) },
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

// DELETE: Delete contract
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('_id');

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const contractsCollection = db.collection('contracts');

    // Verify contract exists
    const existingContract = await contractsCollection.findOne({
      _id: new ObjectId(contractId)
    });
    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const result = await contractsCollection.deleteOne({
      _id: new ObjectId(contractId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Contract deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}

