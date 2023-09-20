---
sidebar_position: 1
---

# Cypress

:::info

This adapter is stable.

:::

## Setup

Install Leftest with the Cypress adapter.

```bash
npm add @antischematic/leftest-cypress
```

Then import `@antischematic/leftest-cypress` in your support file.

```ts
// support/e2e.ts
import "@antischematic/leftest-cypress"
```

## Include or exclude tests

Features, scenarios or examples can be included or excluded for a test run. For example, to run tests that are tagged with `mobile` but exclude tests that are tagged `iphone`

```bash
TAGS=mobile,^iphone cypress run
```

To enable this feature, add the `LEFTEST_TAGS` entry to your cypress config

```ts
import { defineConfig } from "cypress"

export default defineConfig({
   env: {
      // Set this
      LEFTEST_TAGS: process.env.TAGS,
   },
})
```

All tests will run if no tags are specified.
