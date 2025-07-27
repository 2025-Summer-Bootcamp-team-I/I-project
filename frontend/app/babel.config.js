// babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@shared': '../shared',
        },
        extensions: ['.ts', '.tsx', '.js', '.json'],
      },
    ],
  ],
};
  