import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  allowedDevOrigins: ['192.168.101.96', '192.168.137.1'],
};

export default nextConfig;
