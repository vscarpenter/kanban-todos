import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextConfig,
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      // Forbid dangerouslySetInnerHTML so we can't accidentally introduce an
      // XSS sink. React's auto-escaping is the only XSS defence we rely on;
      // see src/lib/utils/security.ts for the broader threat model.
      "react/no-danger": "error",
    },
  },
];

export default eslintConfig;
