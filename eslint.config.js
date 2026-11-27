const { fixupConfigRules } = require("@eslint/compat");
const { FlatCompat } = require("@eslint/eslintrc");
const legacyConfig = require("./.eslintrc.json");

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  { ignores: [".expo/**", "android/**", "dist/**", "build/**"] },
  ...fixupConfigRules(compat.config(legacyConfig)),
];
