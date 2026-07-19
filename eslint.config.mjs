import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Layer boundaries (see docs/ARCHITECTURE.md):
 *
 *   components -> hooks -> services -> managers -> cache
 *
 * Lower layers must never import from higher layers, and only
 * `src/components/InternalFastImage.tsx` may import the native engine.
 */
const restrictLayers = (forbidden) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: forbidden.map((layer) => ({
        group: [`**/${layer}/*`, `../${layer}/*`, `./${layer}/*`],
        message: `This layer must not import from "${layer}" (see docs/ARCHITECTURE.md layer rules).`,
      })),
    },
  ],
});

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['lib/**', 'example/**', 'node_modules/**', '*.js', '*.mjs'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // The native engine may only be imported by the single internal seam.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/InternalFastImage.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native-fast-image',
              message:
                'Only src/components/InternalFastImage.tsx may import the native engine.',
            },
          ],
        },
      ],
    },
  },
  // Image.getSize may only be touched by the dedicated utils wrapper.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/utils/getImageSize.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='Image'][property.name=/^(getSize|getSizeWithHeaders)$/]",
          message:
            'Never call Image.getSize directly. Go through ImageSizeService (which uses utils/getImageSize).',
        },
      ],
    },
  },
  // Per-layer import restrictions.
  { files: ['src/cache/**'], rules: restrictLayers(['managers', 'services', 'hooks', 'components', 'context']) },
  { files: ['src/utils/**'], rules: restrictLayers(['cache', 'managers', 'services', 'hooks', 'components', 'context']) },
  { files: ['src/managers/**'], rules: restrictLayers(['services', 'hooks', 'components', 'context']) },
  { files: ['src/services/**'], rules: restrictLayers(['hooks', 'context']) },
  { files: ['src/hooks/**'], rules: restrictLayers(['components']) },
  // Tests may reach across layers freely.
  {
    files: ['src/**/__tests__/**'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
    },
  }
);
