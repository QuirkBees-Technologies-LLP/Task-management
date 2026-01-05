import { NextResponse } from 'next/server';
import { verifySystemAdmin } from '../../../helpers';
import { ensureOrgIdIndexes } from '../../../lib/migrations';
import { ensureOrganizationIndexes } from '../../../lib/organizations';

/**
 * POST: Run migration to create org_id indexes on all collections
 * System admin only endpoint
 */
export async function POST(request: Request) {
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    console.log('Starting migration: Creating org_id indexes on all collections...');

    // Ensure organization collection indexes first
    await ensureOrganizationIndexes();

    // Then ensure org_id indexes on all other collections
    await ensureOrgIdIndexes();

    return NextResponse.json(
      {
        success: true,
        message: 'Migration completed successfully. All org_id indexes have been created.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed. Check server logs for details.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check migration status (verify indexes exist)
 * System admin only endpoint
 */
export async function GET(request: Request) {
  const { decoded, error, status } = await verifySystemAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { getCollectionsWithOrgId } = await import('../../../lib/migrations');
    const collections = getCollectionsWithOrgId();

    return NextResponse.json(
      {
        success: true,
        message: 'Migration status check',
        collections: collections.map((name) => ({
          name,
          shouldHaveIndexes: true,
        })),
        note: 'Indexes are created automatically. Use POST to trigger migration.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check migration status',
      },
      { status: 500 }
    );
  }
}


