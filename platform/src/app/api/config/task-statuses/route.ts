import { NextResponse } from 'next/server';
import { verifyToken } from '../../helpers';
import { TASK_STATUSES } from './constants';

// GET: Fetch all task statuses
export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    return NextResponse.json(
      {
        success: true,
        statuses: TASK_STATUSES,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching task statuses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task statuses' },
      { status: 500 }
    );
  }
}

