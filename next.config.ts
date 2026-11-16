import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: no server needed, so it can be cached by the service
  // worker and run offline once it has been opened (or installed) once.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
