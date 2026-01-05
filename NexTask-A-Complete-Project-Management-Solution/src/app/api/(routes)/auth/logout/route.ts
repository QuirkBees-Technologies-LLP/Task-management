import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Note: JWT tokens are stateless and stored in localStorage on client side
    // Server doesn't maintain sessions, so we just return success
    // The client should clear the token from localStorage

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in logout API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
