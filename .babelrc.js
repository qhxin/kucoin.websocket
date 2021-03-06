
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        forceAllTransforms: true,
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-transform-runtime',
    'add-module-exports',
  ],
};
