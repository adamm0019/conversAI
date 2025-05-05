module.exports = {
  presets: [
    // Standard preset for compiling modern JavaScript down to compatible versions
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // Preset for handling React syntax (JSX)
    '@babel/preset-react',
    // Preset for handling TypeScript syntax
    '@babel/preset-typescript',
  ],
  plugins: [
    // Plugin to transform import.meta syntax
    'babel-plugin-transform-import-meta',
  ],
};