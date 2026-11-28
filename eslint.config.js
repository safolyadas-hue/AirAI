import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      eqeqeq: ['error', 'always']
    }
  },
  {
    files: ['public/js/**/*.js', 'netlify/**/*.js'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    files: ['public/js/ui/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/domain/*',
                '**/domain/**',
                '../domain/*',
                '../../domain/*',
                '**/services/*',
                '**/services/**',
                '../services/*',
                '../../services/*'
              ],
              message:
                'UI modules must remain render-only and cannot import from domain/ or services/.'
            }
          ]
        }
      ]
    }
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '.netlify/']
  }
];
