const esModules = ['Maintenance'].join('|');

// Set default test environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests-min-32';
process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'maintenance-api';
process.env.JWT_ISSUER = process.env.JWT_ISSUER || 'maintenance-api';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/infrastructure/repository/*',
    '!src/**/infrastructure/repository/**/*'
  ],
  testMatch: [
    '**/*.steps.ts'
  ],
  coveragePathIgnorePatterns: [
    'src/common/*'
  ],
  transform: {
    '^.+\\.(ts|tsx|js)$': ['@swc/jest', {}]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    `/node_modules/(?!${esModules})`
  ],
  testTimeout: 60000
};
