const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");

const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages and avoid duplicates
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Force shared deps to resolve to the app's node_modules to avoid multiple instances
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
  "@tanstack/react-query": path.resolve(
    __dirname,
    "node_modules/@tanstack/react-query"
  ),
  convex: path.resolve(__dirname, "node_modules/convex"),
  "@convex-dev/react-query": path.resolve(
    __dirname,
    "node_modules/@convex-dev/react-query"
  ),
  "@convex-dev/better-auth": path.resolve(
    __dirname,
    "node_modules/@convex-dev/better-auth"
  ),
};

// Enable modern symlink support for pnpm
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Allow searching parent directories for transitive deps (like @babel/runtime)
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, {
  input: "./global.css",
});
