import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // content.js/config.js/scripts are the legacy v1.3 build, kept untouched
    // until the migrated version is validated by hand (see ROADMAP).
    ignores: ['.wxt/**', '.output/**', 'node_modules/**', 'content.js', 'config.js', 'scripts/**'],
  },
  ...tseslint.configs.strict,
  {
    files: ['**/*.ts'],
    rules: {
      eqeqeq: ['error', 'always', { null: 'never' }],
      curly: ['error', 'all'],
      'no-console': 'error',
    },
  },
);
