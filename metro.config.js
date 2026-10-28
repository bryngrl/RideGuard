const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Gradle creates/removes these directories while compiling native plugins.
// Metro needs their JS sources, but must not crawl transient native outputs.
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList ? [existingBlockList] : []),
  /[\\/]android[\\/](?:.*[\\/])?(?:build|\.gradle|\.cxx)(?:[\\/]|$)/,
];

config.transformer.babelTransformerPath =
  require.resolve("react-native-svg-transformer/expo");

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);

config.resolver.sourceExts.push("svg");

config.resolver.extraNodeModules = {
  "@": path.resolve(__dirname, "src"),
  "@/assets": path.resolve(__dirname, "assets"),
};

module.exports = config;
