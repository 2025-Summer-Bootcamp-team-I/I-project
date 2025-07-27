const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @shared 별칭 추가
config.resolver.alias = {
  '@shared': path.resolve(__dirname, '../shared'),
};

config.watchFolders = [
  path.resolve(__dirname, '../shared'),
];

module.exports = config; 