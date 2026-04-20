import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        localPatterns: [
            { pathname: "/uploads/**" },
        ],
    },
    experimental: {
        webpackMemoryOptimizations: true,
    },
};

export default nextConfig;
