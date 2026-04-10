/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    async rewrites() {
        return [
            // Papers API
            {
                source: '/api/papers',
                destination: 'http://localhost:8000/api/papers/',
            },
            {
                source: '/api/papers/interesting',
                destination: 'http://localhost:8000/api/papers/interesting/',
            },
            {
                source: '/api/papers/by-slug/:slug',
                destination: 'http://localhost:8000/api/papers/by-slug/:slug/',
            },
            {
                source: '/api/papers/mark-interesting/:paperid',
                destination: 'http://localhost:8000/api/papers/mark-interesting/:paperid/',
            },
            {
                source: '/api/papers/:paperid/unmark-interesting',
                destination: 'http://localhost:8000/api/papers/:paperid/unmark-interesting/',
            },
            {
                source: '/api/papers/:paperid',
                destination: 'http://localhost:8000/api/papers/:paperid/',
            },

            // Redirect API requests to Django server
            {
                source: '/api/stats/:path*',
                destination: 'http://localhost:8000/api/stats/:path*/',
            },
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/api/:path*/', // Always use Django API server
            },

            // Redirect any remaining /public/ requests to /api/
            {
                source: '/public/:path*',
                destination: 'http://localhost:8000/api/:path*/',
            },
        ]
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    async headers() {
        return [
            {
                // Set CORS headers
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                ],
            },
        ]
    },
}

module.exports = nextConfig
