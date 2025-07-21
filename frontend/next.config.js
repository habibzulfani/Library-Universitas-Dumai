/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost'],
        unoptimized: true, // Disable image optimization in production
    },
    output: 'standalone',
    // experimental: {
    //     serverActions: true,
    // },
}

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL must be set in production!');
}

module.exports = nextConfig 