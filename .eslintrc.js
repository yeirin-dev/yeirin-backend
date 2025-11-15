module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'test/**/*'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn', // any 타입 사용 시 경고만 (error → warn)
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 사용하지 않는 변수 경고만 (error → warn)

    // Import 정렬 및 최적화
    'import/order': [
      'error',
      {
        groups: [
          'builtin',   // Node.js built-in modules
          'external',  // npm packages
          'internal',  // @domain, @application, etc.
          'parent',    // ../
          'sibling',   // ./
          'index',
        ],
        pathGroups: [
          {
            pattern: '@nestjs/**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@domain/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@application/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@infrastructure/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@presentation/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'off', // TypeScript가 이미 체크하므로 off

    // 상대경로 대신 절대경로(@) 사용 강제
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['./domain/*', '../domain/*', '../../domain/*', '../../../domain/*'],
            message: '절대경로 @domain/* 을 사용하세요.',
          },
          {
            group: ['./application/*', '../application/*', '../../application/*', '../../../application/*'],
            message: '절대경로 @application/* 을 사용하세요.',
          },
          {
            group: ['./infrastructure/*', '../infrastructure/*', '../../infrastructure/*', '../../../infrastructure/*'],
            message: '절대경로 @infrastructure/* 을 사용하세요.',
          },
          {
            group: ['./presentation/*', '../presentation/*', '../../presentation/*', '../../../presentation/*'],
            message: '절대경로 @presentation/* 을 사용하세요.',
          },
        ],
      },
    ],
  },
};
