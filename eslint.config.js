import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.wxt/**', '.output/**', 'node_modules/**'],
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
