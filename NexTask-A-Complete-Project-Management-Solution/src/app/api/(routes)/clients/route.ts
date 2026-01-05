import { NextResponse } from 'next/server';
import { userRolesServer, verifyToken } from '../../helpers';
import clientPromise from '../../lib/mongodb';
import { DATABASE_NAME } from '../../config';

export async function GET(request) {
  const { error, status } = await verifyToken(request, userRolesServer.admin);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const companiesCollection = db.collection('companies');
    const userCollection = db.collection('users');

    // Fetch all endpoints
    const companies = await companiesCollection.find({}).toArray();

    const companiesWithUsers: any[] = [];
    for (const company of companies) {
      const adminId = company.admin;
      const admin = await userCollection.findOne({ _id: adminId });

      if (admin) {
        companiesWithUsers.push({
          ...company,
          admin: {
            _id: admin._id,
            name: `${admin.firstName} ${admin.lastName}`,
            email: admin.email,
          },
        });
      }
    }

    return NextResponse.json(companiesWithUsers, { status: 200 });
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 });
  }
}
