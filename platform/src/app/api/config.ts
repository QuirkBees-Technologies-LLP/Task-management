export const JWT_SECRET = process.env.JWT_SECRET;
export const DATABASE_NAME = process.env.DATABASE_NAME;
export const MONGODB_URI = process.env.MONGODB_URI;

export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
export const senderEmail = process.env.NEXT_PUBLIC_SENDER_EMAIL;

export const tokenExpiry = '1d';
export const tokenExpiryLong = '7d';

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUB_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL;
export const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL;
export const STRIPE_COUPON_TOKEN = process.env.STRIPE_COUPON_TOKEN;
