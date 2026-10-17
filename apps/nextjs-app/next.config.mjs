/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["winston", "winston-loki", "prom-client"],
};

export default nextConfig;
