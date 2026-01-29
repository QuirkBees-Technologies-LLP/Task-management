import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';
import { verifyToken, requireOrgIdFromToken, getOrgIdFromToken } from '../../helpers';
import { addOrgIdToQuery, addOrgIdToDocument } from '../../lib/orgIdHelper';

// GET: Fetch all invoices
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const invoicesCollection = db.collection('invoices');

    const query: any = addOrgIdToQuery({}, org_id);
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const total = await invoicesCollection.countDocuments(query);
    const skip = (page - 1) * limit;

    const invoices = await invoicesCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Return minimal fields for list view - exclude heavy fields
    return NextResponse.json(
      {
        success: true,
        invoices: invoices.map((inv) => ({
          _id: inv._id.toString(),
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          clientProject: inv.clientProject,
          clientEmail: inv.clientEmail,
          amount: inv.amount,
          currency: inv.currency,
          status: inv.status,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
          // Exclude: companyDetails, bankingDetails, items, notes (fetch only in detail view)
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
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST: Create new invoice
export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const {
      invoiceNumber,
      clientName,
      clientProject,
      clientEmail,
      amount,
      currency,
      dueDate,
      status: invoiceStatus,
      items,
      notes,
    } = body;

    if (!invoiceNumber || !clientName || !amount) {
      return NextResponse.json(
        { error: 'Invoice number, client name, and amount are required' },
        { status: 400 }
      );
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const invoicesCollection = db.collection('invoices');

    // Check if invoice number exists in the same organization
    const existingInvoice = await invoicesCollection.findOne(
      addOrgIdToQuery({ invoiceNumber }, org_id)
    );
    if (existingInvoice) {
      return NextResponse.json({ error: 'Invoice number already exists' }, { status: 400 });
    }

    // CRITICAL: Capture and store snapshot of company/banking details at creation time
    // These details are IMMUTABLE and must never change after invoice creation
    // This ensures invoices remain accurate historical records
    const companySettingsCollection = db.collection('companySettings');
    const bankingDetailsCollection = db.collection('bankingDetails');

    // IMPORTANT: Company and banking settings are organization-scoped.
    // Never query without org_id, otherwise data from a different organization
    // (e.g. legacy Infoloop data) could be used for this invoice.
    const [companySettings, bankingDetails] = await Promise.all([
      companySettingsCollection.findOne(addOrgIdToQuery({}, org_id)),
      bankingDetailsCollection.findOne(addOrgIdToQuery({}, org_id)),
    ]);

    // Prepare company details to store - ALWAYS store, even if empty
    // This snapshot is permanent and will never be updated
    const companyDetails = companySettings
      ? {
        companyName: companySettings.companyName || '',
        logoUrl: companySettings.logoUrl || '',
        address: companySettings.address || '',
        email: companySettings.email || '',
        phone: companySettings.phone || '',
        taxNumber: companySettings.taxNumber || '',
        website: companySettings.website || '',
      }
      : {
        companyName: '',
        logoUrl: '',
        address: '',
        email: '',
        phone: '',
        taxNumber: '',
        website: '',
      };

    // Prepare banking details to store - ALWAYS store, even if empty
    // This snapshot is permanent and will never be updated
    const bankingInfo = bankingDetails
      ? {
        accountHolder: bankingDetails.accountHolder || '',
        accountNumber: bankingDetails.accountNumber || '',
        bankName: bankingDetails.bankName || '',
        accountType: bankingDetails.accountType || '',
      }
      : {
        accountHolder: '',
        accountNumber: '',
        bankName: '',
        accountType: '',
      };

    const newInvoice = addOrgIdToDocument({
      invoiceNumber,
      clientName,
      clientProject: clientProject || '',
      clientEmail: clientEmail || '',
      amount: parseFloat(amount),
      currency: currency || 'USD',
      dueDate: dueDate ? new Date(dueDate) : null,
      status: invoiceStatus || 'draft',
      items: items || [],
      notes: notes || '',
      // IMMUTABLE: Store company and banking details snapshot at creation time
      // These fields must NEVER be updated after invoice creation
      companyDetails,
      bankingDetails: bankingInfo,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.id || decoded.user_id,
    }, org_id);

    const result = await invoicesCollection.insertOne(newInvoice);

    return NextResponse.json(
      {
        success: true,
        invoice: { ...newInvoice, _id: result.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

// PATCH: Update invoice
export async function PATCH(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const {
      invoiceId,
      invoiceNumber,
      clientName,
      clientProject,
      clientEmail,
      amount,
      currency,
      dueDate,
      status: invoiceStatus,
      items,
      notes,
    } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const invoicesCollection = db.collection('invoices');

    // Verify invoice exists in the same organization
    const existingInvoice = await invoicesCollection.findOne(
      addOrgIdToQuery({
        _id: new ObjectId(invoiceId)
      }, org_id)
    );
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found in your organization' }, { status: 404 });
    }

    // CRITICAL: Invoice company/banking details are IMMUTABLE - never update them
    // Only allow updating invoice-specific fields, never companyDetails or bankingDetails
    const updateData: any = { updatedAt: new Date() };
    if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
    if (clientName) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (clientProject !== undefined) updateData.clientProject = clientProject;
    if (amount) updateData.amount = parseFloat(amount);
    if (currency) updateData.currency = currency;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (invoiceStatus) updateData.status = invoiceStatus;
    if (items) updateData.items = items;
    if (notes !== undefined) updateData.notes = notes;

    // EXPLICITLY exclude companyDetails and bankingDetails from updates
    // These fields are immutable and must never be modified after invoice creation
    delete updateData.companyDetails;
    delete updateData.bankingDetails;

    const result = await invoicesCollection.updateOne(
      addOrgIdToQuery({ _id: new ObjectId(invoiceId) }, org_id),
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Invoice updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE: Delete invoice
export async function DELETE(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('_id');

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const invoicesCollection = db.collection('invoices');

    // Verify invoice exists in the same organization
    const existingInvoice = await invoicesCollection.findOne(
      addOrgIdToQuery({
        _id: new ObjectId(invoiceId)
      }, org_id)
    );
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found in your organization' }, { status: 404 });
    }

    const result = await invoicesCollection.deleteOne(
      addOrgIdToQuery({
        _id: new ObjectId(invoiceId)
      }, org_id)
    );

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

