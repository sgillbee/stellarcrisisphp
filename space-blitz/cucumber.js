module.exports = {
  default: {
    require: [
      'tests/bdd/step-definitions/**/*.ts',
      'tests/bdd/support/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    paths: ['tests/bdd/features/**/*.feature'],
    format: [
      'progress',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    parallel: 2,
    retry: 2,
    retryTagFilter: '@flaky',
    strict: true
  }
};