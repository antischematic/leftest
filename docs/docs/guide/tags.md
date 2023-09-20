---
sidebar_position: 5
---

# Tags

:::info

This API is stable.

:::

:::tip

Only features, scenarios and examples can be tagged. Steps cannot be tagged. An error is thrown if a tag is used incorrectly.

:::

Tags allow you to control when hooks are applies, as well as which scenarios should be included or excluded in a test run.

## Built-in tags

`todo` skips the tagged scenario so that it is not included in the test run. Use this when writing new specs.

`skip` does the same thing as `todo`. Use this to temporarily disable a test.

`only` skips all features and scenarios that are not tagged with `only`. Use this to isolate a test when building or a debugging a feature.

## Tagged hooks

Tags can be used to filter the scope of scenario and step hooks. For example, given the following hook:

```ts
import { beforeScenario, getTags, eq } from '@antischematic/leftest'

const { matchScreenshot } = getTags()

beforeScenario(eq(matchScreenshot), () => {
   // screenshot implementation
})
```

Now the hook will only run on scenarios tagged with `matchScreenshot`.

```ts
import { getTags, feature, scenario } from '@antischematic/leftest'
import { createTestSuite } from "./core"
import steps from "./steps"

const { when, then } = createTestSuite(steps)
const { matchScreenshot } = getTags()

~matchScreenshot
feature('Guess the word', () => {
   scenario('Maker starts a game', () => {
      when('the Maker starts a game')
      then('the Maker waits for a Breaker to join')
   })
})

feature('Cucumbers', () => {
...
})
```

### Tag matchers

Complex expressions for tagged hooks are supported using the following tag matchers:

`eq` Matches when the scenario is tagged with the given tag

`not` Matches when the scenario is not tagged with the given tag

`and` Matches when both sub-expressions are matched

`or` Matches when either sub-expression is matched

```ts
import { eq, not, and, beforeScenario, getTags } from '@antischematic/leftest'

const { mobile, iphone } = getTags()

beforeScenario(and(eq(mobile), not(iphone)), () => {
   console.log('only mobiles that are not iphone')
})
```

## Include or exclude tests

This feature is test framework specific, refer to the documentation for each adapter.
