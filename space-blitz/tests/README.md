# Space Blitz Testing

This document describes the testing setup for the Space Blitz project, including unit tests, BDD-style tests, and end-to-end tests.

## Testing Overview

Space Blitz uses a comprehensive testing strategy with multiple layers:

- **Unit Tests**: Component and API testing with Vitest
- **BDD Tests**: Behavior-driven development with Cucumber and Playwright
- **E2E Tests**: End-to-end testing with Playwright

## Test Structure

```
tests/
├── bdd/                          # Behavior-Driven Development tests
│   ├── features/                 # Gherkin feature files
│   │   └── *.feature
│   ├── step-definitions/         # Step implementation files
│   │   └── *.ts
│   └── support/                  # Cucumber support files
│       └── hooks.ts
└── e2e/                          # End-to-End tests
    └── *.spec.ts
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests (client + server)
npm test

# Run client tests only
npm run test --workspace=client

# Run server tests only
npm run test --workspace=server
```

### BDD Tests
```bash
# Run BDD tests with Cucumber
npm run test:bdd

# Run with specific tags
npm run test:bdd -- --tags "@smoke"

# Run with custom format
npm run test:bdd -- --format progress-bar
```

### E2E Tests
```bash
# Run E2E tests with Playwright
npm run test:e2e

# Run in specific browser
npm run test:e2e -- --project=chromium

# Run with UI mode
npm run test:e2e -- --ui

# Generate and view HTML report
npm run test:e2e -- --reporter=html
npx playwright show-report
```

## Writing BDD Tests

### Feature Files
BDD tests are written in Gherkin syntax in `.feature` files:

```gherkin
Feature: Game Lobby
  As a player
  I want to join games
  So that I can play Space Blitz

  Scenario: Join existing game
    Given I am on the game lobby page
    When I click on "Test Game"
    Then I should be redirected to the game page
```

### Step Definitions
Implement steps in TypeScript using Playwright:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('I am on the game lobby page', async function () {
  await this.page.goto('/');
  await expect(this.page).toHaveTitle(/Space Blitz/);
});

When('I click on {string}', async function (gameName: string) {
  await this.page.locator(`[data-testid="game-item"]:has-text("${gameName}")`).click();
});
```

## Test Data and Fixtures

### Test Selectors
Use data-testid attributes for reliable element selection:

```html
<button data-testid="create-game-button">Create Game</button>
<div data-testid="games-list">
  <div data-testid="game-item">...</div>
</div>
```

### Mock Data
For API-dependent tests, consider using mock data or test-specific endpoints.

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Unit Tests
  run: npm test

- name: Run BDD Tests
  run: npm run test:bdd

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: reports/
```

## Best Practices

### BDD Guidelines
1. **Focus on Behavior**: Describe what the system should do, not how
2. **Use Domain Language**: Write in terms understandable to stakeholders
3. **Keep Scenarios Simple**: One scenario should test one behavior
4. **Use Tags**: Mark scenarios with `@smoke`, `@regression`, etc.

### Test Organization
1. **Descriptive Names**: Use clear, descriptive scenario and step names
2. **Reusable Steps**: Create generic steps that can be reused
3. **Page Objects**: Consider page object pattern for complex interactions
4. **Data Management**: Keep test data separate from test logic

### Performance
1. **Parallel Execution**: Tests run in parallel where possible
2. **Selective Testing**: Use tags to run specific test suites
3. **Retry Logic**: Built-in retry for flaky tests
4. **Timeouts**: Appropriate timeouts for different operations

## Debugging Tests

### BDD Test Debugging
```bash
# Run with detailed output
npm run test:bdd -- --format pretty

# Debug specific scenario
npm run test:bdd -- --name "Join existing game"
```

### E2E Test Debugging
```bash
# Run in headed mode
npm run test:e2e -- --headed

# Slow down execution
npm run test:e2e -- --slowMo=1000

# Generate trace
npm run test:e2e -- --trace on
```

## Test Coverage

### Coverage Reports
Unit test coverage is generated automatically. View reports in the `coverage/` directory.

### Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

## Contributing

When adding new features:
1. Write BDD scenarios first
2. Implement step definitions
3. Add unit tests for components/APIs
4. Add E2E tests for critical user journeys
5. Update this documentation as needed

## Troubleshooting

### Common Issues

**BDD Tests Not Found**
- Ensure `.feature` files are in `tests/bdd/features/`
- Check Cucumber configuration in `cucumber.js`

**Playwright Browser Issues**
- Run `npx playwright install` to install browsers
- Check system requirements for your OS

**Test Timeouts**
- Increase timeout in configuration
- Check for network issues or slow operations
- Use `page.waitForTimeout()` for debugging

**Selector Issues**
- Use `data-testid` attributes for reliable selection
- Avoid CSS selectors that may change with styling updates
- Use Playwright's codegen tool: `npx playwright codegen`

For additional help, check the [Playwright documentation](https://playwright.dev/) and [Cucumber documentation](https://cucumber.io/docs/cucumber/).