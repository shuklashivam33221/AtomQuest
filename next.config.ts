import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "ws", "@neondatabase/serverless", "pg"],
  allowedDevOrigins: ["192.168.56.1", "localhost"],
};

export default nextConfig;
