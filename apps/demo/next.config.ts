import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
        source: "/:path*",
      },
    ];
  },
  serverExternalPackages: ["@base-org/account"],
  transpilePackages: [
    "@base-game-migration/entitlements-core",
    "@base-game-migration/payments-core",
  ],
};

export default nextConfig;
