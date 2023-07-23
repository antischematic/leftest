# @antischematic/leftest-playwright

Shift-Left Testing for Playwright

## Setup

```bash
npm add @antischematic/leftest-playwright
```

## Usage

Define your feature specs. Tag new features and/or scenarios with `~todo` to prevent them running.

```ts
import {
   createTestSuite,
   feature,
   scenario,
   background,
   todo,
} from "@antischematic/leftest"

const { given, when, then, examples } = createTestSuite()
import { createTestSuite, feature, scenario } from "@antischematic/leftest"
import steps from "./steps"

~todo
feature("My awesome new feature", () => {
   background(() => {
      given("I am logged in as 'Bob'")
   })

   ~todo
   scenario("User can do awesome things", () => {
      given("I visit '/my-awesome-page'")
      when("I press the button [5] times")
      then("Something <awesome> happens")

      examples([
         { awesome: "hello world" },
         { awesome: 1337 },
         { awesome: true },
         { awesome: ["foo", "bar"] },
      ])
   })
})
```

Implement steps in a `steps.ts` file

```ts
import { createSteps } from "@antischematic/leftest-playwright"

export default createSteps({
   "I visit <url>": async ({ page }, url: string) => {
      await page.goto(url)
   },

   "I press the button <number> times": async ({ page }, number: number) => {
      // implementation
   },

   "Something <awesome> happens": async ({ page }, awesome: unknown) => {
      // implementation
   },
})

```

Import steps into your feature and (optionally) extract placeholder arguments.

```ts
import {
   createTestSuite,
   feature,
   scenario,
   background,
} from "@antischematic/leftest"
import steps from "./steps"

const { given, when, then, examples } = createTestSuite(steps)

feature("My awesome new feature", () => {
   background(() => {
      given("I am logged in as <user>", "Bob")
   })

   scenario("User can do awesome things", () => {
      given("I visit <page>", "/my-awesome-page")
      when("I press the button <several> times", 5)
      then("Something <awesome> happens")

      examples([
         { awesome: "hello world" },
         { awesome: 1337 },
         { awesome: true },
         { awesome: ["foo", "bar"] },
      ])
   })
})
```

## Tags

Features, scenarios and examples can be tagged to control how tests run.

### Skip or isolate tests

Use the `todo` and `skip` tags to skip specific features, scenarios or examples.

```ts
import {
   feature,
   scenario,
   createTestSuite,
   todo,
} from "@antischematic/leftest"

const { given } = createTestSuite()

~todo
feature("My new awesome feature", () => {
   scenario("User can't do awesome things yet", () => {
      given("I am logged in")
   })
})
```

Use the `only` tag to run specific features, scenarios or examples. All other tests will be marked as skipped.

```ts
import {
   feature,
   scenario,
   createTestSuite,
   todo,
} from "@antischematic/leftest"

const { given } = createTestSuite()

feature("My new awesome feature", () => {
   ~only
   scenario("User can do awesome things", () => {
      given("I am logged in")
   })

   scenario("This scenario won't run", () => {
      given("I am logged in")
   })
})
```

### Include or exclude tests

Features, scenarios or examples can be included or excluded for a test run.

```bash
LEFTEST_TAGS=include,^butNotThisOne npx playwright test
```

Only tests with matching tags will be executed.

```ts
import {
   feature,
   scenario,
   createTestSuite,
   getTags,
} from "@antischematic/leftest"

const { given } = createTestSuite()
const { include, butNotThisOne } = getTags()

feature("My new awesome feature", () => {
   ~include
   scenario("User can do awesome things", () => {
      given("I am logged in")
   })

   ~include
   ~butNotThisOne
   scenario("This scenario won't run", () => {
      given("I am logged in")
   })
})
```

## Hooks

The `beforeScenario`, `beforeStep`, `afterScenario` and `afterStep` hooks can be used to customise test behaviour.

```ts
import { devices } from "@playwright/test"
import { beforeScenario } from "@antischematic/leftest-playwright"

beforeScenario(({ page }, scenario) => {
   if (scenario.hasTag(mobile) && !scenario.hasTag(tablet)) {
      page.setViewportSize(devices['iPhone X'].viewport);
   }
})
```

### Tagged hooks

Hooks can be configured to run on specific features, scenarios or examples. Combine `and`, `or`, `eq` and `not` matchers to match different tag combinations.

```ts
import { getTags, and, eq, not } from "@antischematic/leftest"
import { beforeScenario } from "@antischematic/leftest-playwright"

const { mobile, tablet } = getTags()

beforeScenario(and(eq(mobile), not(tablet)), ({ page }) => {
   page.setViewportSize(devices['iPhone X'].viewport);
})
```

## Utils

`isIncluded` checks if a tag is included via the `LEFTEST_TAGS` environment variable

`isExcluded` checks if a tag is excluded via the `LEFTEST_TAGS` environment variable

`isUsed` checks if a tag is used in the current test run

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

export default createSteps({
   "I mount the component": async ({ mount }) => {
      const component = await mount(<App />)
   }
})
```
