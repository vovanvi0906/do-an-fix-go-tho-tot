const path = require('node:path');
module.exports = { rootDir: '../..', testEnvironment: 'node', testMatch: ['<rootDir>/test/symptoms/*.integration.js'], transform: { '^.+\\.js$': ['babel-jest', { configFile: path.resolve(__dirname, '../../.babelrc') }] }, testTimeout: 20000 };
