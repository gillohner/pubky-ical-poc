import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["pubky-app-specs"],

  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Handle the pubky-app-specs package
    config.resolve.alias = {
      ...config.resolve.alias,
      "pubky-app-specs": path.resolve(__dirname, "../pubky-app-specs/pkg"),
    };

    return config;
  },

  turbopack: {
    root: __dirname,
    resolveAlias: {
      "pubky-app-specs": path.resolve(__dirname, "../pubky-app-specs/pkg"),
    },
  },
};

export default nextConfig;
