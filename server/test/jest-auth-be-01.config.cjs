const path = require('path');
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/auth-be-01.e2e-spec.js'],
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      { configFile: path.resolve(__dirname, '../.babelrc') },
    ],
  },
  testTimeout: 15000,
};
