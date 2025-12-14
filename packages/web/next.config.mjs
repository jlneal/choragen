/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages for monorepo support
  // Note: @choragen/core is excluded - it's externalized for server-only use
  transpilePackages: ["@choragen/contracts"],

  // Externalize @choragen/core for server-side only (has Node.js dependencies)
  // This prevents webpack from bundling it for client components
  experimental: {
    serverComponentsExternalPackages: ["@choragen/core"],
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
