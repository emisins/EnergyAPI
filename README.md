# ENSEK tech test

Task has been done using TypeScript and [PlayWright](https://playwright.dev/) framework as it has good support for both UI and API tests.
[JMeter](https://jmeter.apache.org/) has been used for performance tests

## Dependencies

Install [Node JS](https://nodejs.org/en/download). Running this command in console should work as a result

```bash
npm -v 
```

Run this to install dependencies (e.g. PlayWright, CSV parse, JSON validation)

```bash
npm install
```

## File structure

* [JSON/](JSON) - JSON file with test data
* [schemas/](schemas) - JSON schemas to validate API respone
* [test_JMeter/](test_JMeter) - JMeter project file
* [test-doc/](test-doc) - test documents, e.g. test cases and bug reports
* [tests/](tests) - Playwright tests
* [util/](util) - some helper functions
* [./playwright.config.ts](./playwright.config.ts) - Playwright test configuration

## Commands to execute tests

Run all tests (API and UI)

```bash
npx playwright test
```

To see HTML report after test run:

```bash
npx playwright show-report
```

Run tests with spedific tags add `--grep` and a tag

```bash
npx playwright test --grep "@smoke"
```

To start the interactive UI mode add `--ui` at the end of any command

```bash
npx playwright test --ui
```

To run tests in debug mode add `--debug` at the end of any command

```bash
npx playwright test --debug
```
