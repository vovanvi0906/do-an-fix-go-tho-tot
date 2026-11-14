const path = require('path');
module.exports = { rootDir: '../..', testEnvironment: 'node', testMatch: ['<rootDir>/test/face/*.integration.js'],
  transform: { '^.+\\.js$': ['babel-jest', { configFile: path.resolve(__dirname, '../../.babelrc') }] }, testTimeout: 20000 };
