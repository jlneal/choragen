/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages for monorepo support
  transpilePackages: ["@choragen/core"],

  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
