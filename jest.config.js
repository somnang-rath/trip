/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['**/src/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    // expo/src/winter uses dynamic import() which jest-runtime rejects in setup
    // context — redirect to a no-op stub so the jest-expo preset setup passes.
    '^expo/src/winter$': '<rootDir>/__mocks__/empty.js',
    '^expo/src/winter/(.*)$': '<rootDir>/__mocks__/empty.js',
    '^expo/virtual/streams$': '<rootDir>/__mocks__/empty.js',
  },
};
