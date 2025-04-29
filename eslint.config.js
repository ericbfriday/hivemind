import antfu from '@antfu/eslint-config'
import command from 'eslint-plugin-command/config'

export default antfu({
  lessOpinionated: true,
  isInEditor: false,
  stylistic: {
    pluginName: 'style',
    'quotes': 'single',
    indent: 4,
    overrides: {
      'curly': 'off',
      'style/brace-style': ['error', 'stroustrup'],
      'style/indent': ["error", 4],
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
    tsconfigPath: './tsconfig.json',
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
    },
    overridesTypeAware: {
      // Copy pasted from the source - commented out lines are defaults.
      // 'dot-notation': 'off',
      // 'no-implied-eval': 'off',
      // 'ts/await-thenable': 'error',
      // 'ts/dot-notation': ['error', { allowKeywords: true }],
      'ts/no-floating-promises': 'off',
      // 'ts/no-for-in-array': 'error',
      // 'ts/no-implied-eval': 'error',
      'ts/no-misused-promises': 'off',
      'ts/no-unnecessary-type-assertion': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-unsafe-return': 'off',
      'ts/promise-function-async': 'off',
      'ts/restrict-plus-operands': 'off',
      'ts/restrict-template-expressions': 'off',
      // 'ts/return-await': ['error', 'in-try-catch'],
      'ts/strict-boolean-expressions': ['off', { allowNullableBoolean: true, allowNullableObject: true }],
      // 'ts/switch-exhaustiveness-check': 'error',
      // 'ts/unbound-method': 'error',
    }
  },
  jsonc: true,
  yaml: true,
  ignores: ['mock/**', './dist/**', './node_modules/**', './.nuxt/**', './.output/**', './.vercel/**', 'snippets.js', '*.example.js', '*.example.ts', '*.config.js', '*.config.ts'],
  formatters: true,
}, {
  'import/resolver-next': [
    createTypeScriptResolver(/* Your override options go here */),
    createNodeResolver(/* Your override options go here */),
  ],

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
      'style/semi': ['warn', 'always'],
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
  },
  command(),
)
