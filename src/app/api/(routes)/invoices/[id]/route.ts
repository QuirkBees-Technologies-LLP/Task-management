import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { verifyToken, requireOrgIdFromToken } from '../../../helpers';
import { addOrgIdToQuery } from '../../../lib/orgIdHelper';

// GET: Fetch single invoice by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const id = params?.id || new URL(request.url).pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID format' }, { status: 400 });
    }

    // Get org_id from token - required for organization scoping
    const org_id = requireOrgIdFromToken(decoded);

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const invoicesCollection = db.collection('invoices');

    // Build query scoped to the current organization
    const query: any = addOrgIdToQuery({ _id: new ObjectId(id) }, org_id);

    const invoice = await invoicesCollection.findOne(query);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate totals from items if items exist
    let subtotal = invoice.amount || 0;
    let tax = 0;
    let total = subtotal;

    if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
      subtotal = invoice.items.reduce((sum: number, item: any) => {
        const itemTotal = (item.quantity || 0) * (item.price || 0);
        return sum + itemTotal;
      }, 0);

      // If tax rate is provided in items or invoice, calculate it
      const taxRate = invoice.taxRate || 0;
      tax = subtotal * (taxRate / 100);
      total = subtotal + tax;
    }

    // CRITICAL: Invoice data must be immutable once created
    // ALWAYS use stored company/banking details if they exist - NEVER fetch current settings
    // If stored details exist (even if empty object), use them - they represent the snapshot at creation time
    let companyDetails = invoice.companyDetails;
    let bankingDetails = invoice.bankingDetails;

    // Simple check: Does the invoice document have these fields?
    // If the field exists on the invoice (even if empty object), it means it was stored at creation time
    // We should use it, not fetch current settings
    const hasStoredCompanyDetails = invoice.hasOwnProperty('companyDetails') &&
      companyDetails !== null &&
      companyDetails !== undefined;

    const hasStoredBankingDetails = invoice.hasOwnProperty('bankingDetails') &&
      bankingDetails !== null &&
      bankingDetails !== undefined;

    // ONLY fetch current settings if the invoice document doesn't have these fields at all
    // This means it's a truly old invoice created before we started storing these details
    // If the fields exist (even as empty objects), they represent the snapshot at creation time
    if (!hasStoredCompanyDetails || !hasStoredBankingDetails) {
      const companySettingsCollection = db.collection('companySettings');
      const bankingDetailsCollection = db.collection('bankingDetails');

      // Fetch current settings scoped to the same organization as the invoice.
      // Never use global settings without org_id, to avoid leaking data
      // from another organization.
      const [companySettings, bankingInfo] = await Promise.all([
        companySettingsCollection.findOne(addOrgIdToQuery({}, org_id)),
        bankingDetailsCollection.findOne(addOrgIdToQuery({}, org_id)),
      ]);

      // Only fetch and use current settings if the field doesn't exist on the invoice document
      // This is for display only - we NEVER save these to the invoice document
      if (!hasStoredCompanyDetails) {
        companyDetails = companySettings
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
      }

      if (!hasStoredBankingDetails) {
        bankingDetails = bankingInfo
          ? {
            accountHolder: bankingInfo.accountHolder || '',
            accountNumber: bankingInfo.accountNumber || '',
            bankName: bankingInfo.bankName || '',
            accountType: bankingInfo.accountType || '',
          }
          : {
            accountHolder: '',
            accountNumber: '',
            bankName: '',
            accountType: '',
          };
      }
    }
    // If invoice has stored details (hasStoredCompanyDetails && hasStoredBankingDetails), 
    // use them as-is - they represent the immutable snapshot at creation time

    return NextResponse.json(
      {
        success: true,
        invoice: {
          ...invoice,
          _id: invoice._id.toString(),
          subtotal,
          tax,
          total,
          // Include stored company and banking details in response
          companyDetails,
          bankingDetails,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

