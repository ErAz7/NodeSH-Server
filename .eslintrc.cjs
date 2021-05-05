module.exports = {
    extends: [
        'eslint:recommended',
        'standard',
        'plugin:react/recommended'
    ],
    rules: {
        camelcase: [0, { properties: 'never' }],
        'no-console': [1, { allow: ['info', 'error'] }],
        'no-labels': 0,
        indent: [2, 4, { SwitchCase: 1, ignoredNodes: ['TemplateLiteral > *'] }],
        'jsx-quotes': [2, 'prefer-single'],
        'jsx-a11y/href-no-hash': 'off',
        'react/jsx-boolean-value': [2, 'always'],
        'react/jsx-closing-bracket-location': [2, { selfClosing: 'after-props', nonEmpty: 'after-props' }],
        'react/jsx-curly-spacing': [2, 'never', { allowMultiline: false }],
        'react/jsx-max-props-per-line': [2, { maximum: 3 }],
        'react/self-closing-comp': 2,
        'react/sort-comp': [1, {
            order: [
                'propTypes',
                'defaultProps',
                'static-methods',
                'lifecycle',
                'everything-else',
                'render'
            ]
        }],
        semi: [2, 'always'],
        'space-before-function-paren': ['error', {
            anonymous: 'never',
            named: 'never',
            asyncArrow: 'ignore'
        }],
        'valid-jsdoc': ['error', {
            prefer: {
                arg: 'param',
                argument: 'param',
                return: 'returns'
            },
            preferType: {
                object: 'Object',
                array: 'Array',
                string: 'String',
                number: 'Number',
                boolean: 'Boolean',
                promise: 'Promise'
            },
            requireReturn: false,
            requireReturnType: true,
            requireParamDescription: false,
            requireReturnDescription: false,
            matchDescription: '.+'
        }],
        'padding-line-between-statements': [
            'error',
            { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
            { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
            { blankLine: 'always', prev: '*', next: 'return' },
            { blankLine: 'always', prev: 'directive', next: '*' },
            { blankLine: 'any', prev: 'directive', next: 'directive' },
            { blankLine: 'always', prev: 'import', next: '*' },
            { blankLine: 'any', prev: 'import', next: 'import' },
            { blankLine: 'any', prev: ['const', 'let', 'var'], next: 'export' },
            { blankLine: 'any', prev: 'export', next: 'export' },
            { blankLine: 'always', prev: 'function', next: '*' },
            { blankLine: 'always', prev: '*', next: 'function' },
            { blankLine: 'always', prev: 'block-like', next: '*' },
            { blankLine: 'always', prev: '*', next: 'block-like' },
            { blankLine: 'always', prev: 'class', next: '*' },
            { blankLine: 'always', prev: '*', next: 'class' }
        ]
    }
};
