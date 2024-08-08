import prettier from 'eslint-config-prettier';
import chaiFriendly from 'eslint-plugin-chai-friendly';
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,
  prettier,
  chaiFriendly.configs.recommendedFlat,
  {
    files: ['**/*.ts'],
    rules: {
      'max-len': ['error', 150, 2],
      camelcase: [
        'error',
        {
          ignoreImports: true
        }
      ],
      indent: [
        'error',
        2,
        {
          SwitchCase: 1
        }
      ],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'no-console': 'error',
      'require-await': 'error',
      'no-return-await': 'error',
      'object-shorthand-properties-first': 'off',
      'chai-friendly/no-unused-expressions': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    },
    languageOptions: {
      globals: {
        assert: true,
        expect: true,
        artifacts: true,
        contract: true
      }
    }
  }
];
