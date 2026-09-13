import { configApp } from '@adonisjs/eslint-config'
export default configApp({
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn', // Changes the red error to a yellow warning
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
})
