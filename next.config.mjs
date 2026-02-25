/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drcmantndmqrcwpcezoy.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
  // Allow large file uploads via API routes
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default nextConfig;
