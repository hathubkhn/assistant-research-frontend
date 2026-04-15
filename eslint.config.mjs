import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      semi: ["error", "never"],
      quotes: [
        "error",
        "single",
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      "jsx-quotes": ["error", "prefer-single"],
      "comma-dangle": ["error", "always-multiline"],
      "eol-last": ["error", "always"],
      "no-trailing-spaces": "error",
      "object-curly-spacing": ["error", "always"],
      "prefer-const": "warn",
      "no-var": "error",

      // Keep build unblocked by common migration-era lint issues.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
