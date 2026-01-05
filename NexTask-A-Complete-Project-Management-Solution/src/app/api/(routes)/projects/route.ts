import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  try {
    return NextResponse.json({ success: true, project: [] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  try {
    // await connectDB();
    // const projects = await Project.find();
    return NextResponse.json({ success: true, projects: [] });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function PUT(_req: NextRequest) {
  try {
    return NextResponse.json({ success: true, project: [] });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
