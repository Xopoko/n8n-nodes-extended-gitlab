const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({ baseDirectory: __dirname, resolvePluginsRelativeTo: __dirname });
const eslintrc = require('./.eslintrc.js');
delete eslintrc.root;
module.exports = [
  ...compat.config(eslintrc),
];
