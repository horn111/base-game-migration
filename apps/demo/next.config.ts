import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@base-game-migration/entitlements-core",
    "@base-game-migration/payments-core",
  ],
};

export default nextConfig;
