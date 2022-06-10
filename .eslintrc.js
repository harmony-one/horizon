module.exports = {
    env: {
        browser: false,
        es2021: true,
        mocha: true,
        node: true
    },
    plugins: ['@typescript-eslint'],
    extends: ['standard', 'plugin:node/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12
    },
    rules: {
        'node/no-unsupported-features/es-syntax': [
            'error',
            {
                ignores: ['modules']
            }
        ],
        'node/no-unpublished-import': 0,
        'node/no-missing-import': ['error', {
            tryExtensions: ['.js', '.json', '.node', '.ts']
        }],
        indent: ['error', 4]
    }
}