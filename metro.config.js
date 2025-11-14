const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Add .bin files to asset extensions so Metro doesn't try to process them
    assetExts: [...defaultConfig.resolver.assetExts, 'bin'],
    // Ensure .bin files are NOT treated as source files
    sourceExts: defaultConfig.resolver.sourceExts.filter(ext => ext !== 'bin'),
  },
  // Ensure Metro doesn't try to transform .bin files
  transformer: {
    ...defaultConfig.transformer,
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  },
};

module.exports = mergeConfig(defaultConfig, config);
