const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'out/**',
      '.env*',
      '.vscode/**',
      '.idea/**',
      '*.log',
      'coverage/**',
      '*.tsbuildinfo',
      '.eslintcache',
      '.cache/**',
      '.vercel/**',
      '.cursor/**',
      '*.db',
      '*.sqlite',
      'iphoneclonefiles/**',
      'scripts/**',
      'next.config.ts',
      'app/api/test-error-tracking/**',
      'lib/config/logging.ts',
      'lib/validations/env.ts',
      '**/*.generated.*',
      '**/generated/**',
    ],
  },

  ...compat.extends('next/core-web-vitals'),

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Basic rules
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Import rules
      'import/no-unresolved': 'off', // Let TypeScript handle this
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
    },
  },

  // Specific overrides for config files
  {
    files: ['*.config.*', 'next.config.*', 'tailwind.config.*', 'postcss.config.*'],
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  },
];
