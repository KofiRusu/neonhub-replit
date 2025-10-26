/** @type {import('jest').Config} */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Add more setup options after each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  testEnvironment: 'jsdom',
  
  // Module file extensions for modules, directories, etc.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // A map from regular expressions to module names that allow to stub out resources
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Handle CSS imports
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // A list of paths to modules that run some code to configure or set up the test environment
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
    '**/tests/**/*.(ts|tsx|js)',
  ],
  
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],
  
  // The directory where Jest should output its coverage files
  collectCoverageFrom: [
    'src/**/*.(ts|tsx|js)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.(ts|tsx)',
    '!src/**/__tests__/**/*',
    '!src/**/__mocks__/**/*',
  ],
  
  // A list of reporter names that Jest uses
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // A list of names of files that should not be included in coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/',
    '/src/__mocks__/',
    '/src/**/*.stories.(ts|tsx)',
    '/src/**/*.d.ts',
  ],
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A set of global variables that need to be available in all test environments
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Transform files with babel
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest'],
  },
  
  // Clear mocks automatically between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically reset mock state between every test
  resetMocks: true,
  
  // Indicates if the coverage information should be collected while executing the test
  collectCoverage: true,
  
  // Force exit with non-zero code if coverage is below threshold
  forceExit: !!process.env.CI,
})

module.exports = createJestConfig