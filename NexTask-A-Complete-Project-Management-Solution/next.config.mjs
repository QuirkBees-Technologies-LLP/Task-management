/** @type {import('next').NextConfig} */
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  env: {
    NEXT_PUBLIC_VERSION: packageJson.version,
  },
  images: {
    domains: ['res.cloudinary.com', 'img.logoipsum.com'],
  },
};

export default nextConfig;
