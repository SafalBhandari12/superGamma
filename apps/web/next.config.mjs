/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@supergamma/schema", "@supergamma/ui"],
  /**
   * In production the browser only ever talks to this app's own origin, and
   * /api/* is proxied to the API deployment. That keeps Better Auth's session
   * cookie first-party (so middleware.ts can see it, and Safari doesn't drop it).
   */
  async rewrites() {
    const apiOrigin = process.env.API_PROXY_URL;
    return apiOrigin ? [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }] : [];
  },
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
