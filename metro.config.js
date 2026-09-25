const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

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