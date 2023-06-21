# @antischematic/leftest-cypress

Shift-Left Testing for Cypress

## Setup

```bash
npm add @antischematic/leftest-cypress
```

Import `@antischematic/leftest-cypress` in your support file.

```ts
import "@antischematic/leftest-cypress"
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
export default {
   "I am logged in as <user>": (user: string) => {
      cy.session(user, () => {
         cy.visit("/login")
         cy.get('input[name="user"]').type(user)
         cy.get('input[name="password"]').type("s3cr3t")
         cy.get('input[type="submit"]').click()
      })
   },
   "I visit <page>": (page: string) => {
      cy.visit(page)
   },
   "I press the button <several> times": (several: number) => {
      for (let i = 0; i < several; i++) {
         cy.get("button").click()
      }
   },
   "Something <awesome> happens": (awesome: unknown) => {
      cy.log("What's awesome?:", awesome)
   },
}
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
TAGS=include,^butNotThisOne cypress run
```

To enable this feature, add the `LEFTEST_TAGS` entry to your cypress config:

```ts
import { defineConfig } from "cypress"

export default defineConfig({
   env: {
      // Set this
      LEFTEST_TAGS: process.env.TAGS,
   },
})
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
import { beforeStep, isIncluded } from "@antischematic/leftest"

beforeStep((scenario) => {
   if (scenario.hasTag(mobile) && !scenario.hasTag(tablet)) {
      cy.viewport("iphone-6")
   }
})
```

> Note: These hooks exhibit the same behaviour as `before`/`beforeEach` would with automatic resetting of mocks, viewports and
> intercepts between each test. Each step creates a new test.

### Tagged hooks

Hooks can be configured to run on specific features, scenarios or examples. Combine `and`, `or`, `eq` and `not` matchers to match different tag combinations.

```ts
import { beforeStep, getTags, and, eq, not } from "@antischematic/leftest"

const { mobile, tablet } = getTags()

beforeStep(and(eq(mobile), not(tablet)), () => {
   cy.viewport("iphone-6")
})
```

## Utils

`isIncluded` checks if a tag is included via the `LEFTEST_TAGS` environment variable

`isExcluded` checks if a tag is excluded via the `LEFTEST_TAGS` environment variable

`isUsed` checks if a tag is used in the current test run
