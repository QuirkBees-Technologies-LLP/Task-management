import { NextResponse } from 'next/server';

/**
 * SuperAdmin Logout API
 * Simple logout endpoint (client-side token removal is primary)
 */
export async function POST(request: Request) {
  try {
    // Logout is primarily handled client-side by removing the token
    // This endpoint can be used for server-side session invalidation if needed
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in superadmin logout API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}



