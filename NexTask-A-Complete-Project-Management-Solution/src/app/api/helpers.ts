import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config';

export const authApiRoutes = ['auth/login', 'auth/signup', 'auth/change-password'];

// ✅ Token verification helper
export async function verifyToken(request: Request, role?: string, superuser?: boolean) {
  const allowedRoles = [role];
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return { error: 'Token missing', status: 400 };

  try {
    const decoded = jwt.verify(token, JWT_SECRET!);

    // strictly check role
    if ((role && !allowedRoles.includes(decoded.role)) || (superuser && !decoded.superuser)) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { decoded };
  } catch {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export const userRolesServer = {
  admin: 'Admin',
  regular: 'Regular',
};

export const extractPublicId = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) return null;

    // Get everything after "upload/" (excluding version)
    const publicIdParts = urlParts.slice(uploadIndex + 2); // Skip version (e.g., v1717171717)
    const lastPart = publicIdParts.pop() ?? '';

    // Remove file extension (e.g., .jpg, .png)
    const filename = lastPart.split('.')[0];
    publicIdParts.push(filename);

    return publicIdParts.join('/');
  } catch (_error) {
    return null;
  }
};
