import antfu from '@antfu/eslint-config'

export default antfu({
  lessOpinionated: true,
  stylistic: {
    pluginName: 'style',
    'quotes': 'single',
    overrides: {
      'curly': 'off',
      'style/brace-style': ['error', 'stroustrup'],
      'style/indent': ["error", 2],
      'style/no-console': 'off',
      'style/semi': ['warn', 'always'],
      'style/no-tabs': 'warn',
      'style/max-statements-per-line': 'warn',
      'style/no-mixed-spaces-and-tabs': 'warn',
    }
  },
  javascript: {
    overrides: {
      'no-console': 'off',
    }
  },
  typescript: {
    overrides: {
      'ts/no-namespace': ['warn', { allowDeclarations: true, allowDefinitionFiles: true }],
      'ts/no-explicit-any': 1,
      'ts/strict-boolean-expressions': 0,
      'ts/no-unsafe-call': 0,
      'ts/no-unsafe-member-access': 0,
      'ts/no-unsafe-return': 0,
      'ts/no-unsafe-argument': 0,
      'ts/no-unsafe-assignment': 0,
      'ts/no-unused-vars': 0,
      'ts/no-unused-expressions': 1,
      'ts/no-empty-function': 1,
      'ts/no-empty-interface': 0,
    }
  },
  jsonc: true,
  yaml: true,
  ignores: ['mock/**', './dist/**', './node_modules/**', './.nuxt/**', './.output/**', './.vercel/**', 'snippets.js', '*.example.js', '*.example.ts', '*.config.js', '*.config.ts'],
  formatters: true,
},
  {
    files: ['*.ts', '*.js'],
    rules: {
      'unused-imports/no-unused-vars': 0,
      'unused-imports/no-unused-imports': 0,
      'import/no-unresolved': [
        'warn',
        {
          ignore: [
            'relations.local',
            'settings.local',
          ],
        },
      ],
      'import/no-unassigned-import': [
        'warn',
        {
          allow: [
            'prototype/*',
            '**/constants',
          ],
        },
      ],
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: false,
        },
      ],
      'unicorn/prefer-node-protocol': [
        'off',
      ],
      'unicorn/no-array-callback-reference': [
        'off',
      ],
      'unicorn/no-array-method-this-argument': [
        'off',
      ]
    },
  },
  {
    rules: {
      'regexp/no-misleading-capturing-group': 1,
      'unused-imports/no-unused-vars': 0,
      'unused-imports/no-unused-imports': 0,
      'import/no-unresolved': [
        'warn',
        {
          ignore: [
            'relations.local',
            'settings.local',
          ],
        },
      ],
      'import/no-unassigned-import': [
        'warn',
        {
          allow: [
            'prototype/*',
            '**/constants',
          ],
        },
      ],
    }
  }
)
