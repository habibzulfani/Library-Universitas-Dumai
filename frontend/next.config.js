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

module.exports = nextConfig 