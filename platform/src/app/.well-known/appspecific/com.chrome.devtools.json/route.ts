import { NextResponse } from 'next/server';

// Handle Chrome DevTools requests - return 404 (this is expected)
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}


