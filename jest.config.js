export default {
  testEnvironment: "jsdom",
  setupFilesAfterSetup: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/hooks/(.*)$": "<rootDir>/hooks/$1",
    "^@/types/(.*)$": "<rootDir>/types/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  testMatch: ["<rootDir>/tests/**/*.test.(ts|tsx)"],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "hooks/**/*.ts",
    "components/**/*.tsx",
    "!**/*.d.ts",
    "!**/*.stories.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};