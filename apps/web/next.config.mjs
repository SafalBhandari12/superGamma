/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@supergamma/schema", "@supergamma/ui"],
  webpack(config) {
    // @supergamma/schema and @supergamma/ui import their own files with
    // explicit ".js" specifiers (required by Node's ESM resolution, which
    // apps/api runs under directly) even though the files on disk are
    // ".ts"/".tsx". Webpack doesn't do that remapping by default.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
