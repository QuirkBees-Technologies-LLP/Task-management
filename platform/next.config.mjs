/** @type {import('next').NextConfig} */
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

// List of Node.js-only packages that should not be bundled
const serverOnlyPackages = [
  'jsonwebtoken',
  'bcryptjs',
  'mongoose',
  'nodemailer',
  'formidable',
  'multer',
  'jwa',
  'jws',
  'buffer-equal-constant-time',
  'ecdsa-sig-formatter',
  'safe-buffer',
];

const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  env: {
    NEXT_PUBLIC_VERSION: packageJson.version,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img.logoipsum.com',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Prevent Node.js modules from being bundled for the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
      };

      // Exclude server-only packages from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      serverOnlyPackages.forEach((pkg) => {
        config.resolve.alias[pkg] = false;
      });
    }

    // For server-side: mark Node.js-only packages as external using function
    if (isServer) {
      const originalExternals = config.externals;

      config.externals = [
        // Keep original externals if they exist
        ...(Array.isArray(originalExternals) ? originalExternals : originalExternals ? [originalExternals] : []),
        // Add function to handle our server-only packages
        ({ context, request }, callback) => {
          // Check if request matches any server-only package
          const isServerOnly = serverOnlyPackages.some(
            (pkg) => request === pkg || request.startsWith(`${pkg}/`)
          );

          if (isServerOnly) {
            return callback(null, `commonjs ${request}`);
          }

          // For other requests, call original externals if it's a function
          if (typeof originalExternals === 'function') {
            return originalExternals({ context, request }, callback);
          }

          // Default: don't externalize
          callback();
        },
      ];
    }

    return config;
  },
};

export default nextConfig;
