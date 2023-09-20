---
sidebar_position: 2
---

# Playwright

:::caution

This adapter is experimental.

:::

## Setup

Install Leftest with the Playwright adapter.

```bash
npm add @antischematic/leftest-playwright
```

## Include or exclude tests

Features, scenarios or examples can be included or excluded for a test run. For example, to run tests that are tagged with `mobile` but exclude tests that are tagged `iphone`

```bash
LEFTEST_TAGS=mobile,^iphone npx playwright test
```

All tests will run if no tags are specified.

## Extending Playwright test context

To extend the test context, call `extendTest` with an instance of `TestType` and extend the `PlaywrightContext` interface.

For example, to enable component testing for react, create a `support.ts` file.

```ts
import { test } from "@playwright/experimental-ct-react"
import { extendTest } from "@antischematic/leftest-playwright"

export const createSteps = extendTest(test)
```

Then use this to create your steps

```tsx
import { createSteps } from "./support"

const steps = {
   "I mount the component": async ({ mount }) => {
      await mount(<App />)
   }
}

export default createSteps(steps)
```
