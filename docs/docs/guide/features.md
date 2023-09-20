---
sidebar_position: 2
---

# Features

:::info

This API is stable.

:::


Start with the feature file. This describes what the features are, and various scenarios for interacting with each feature. Mark features as `todo` until you are ready to implement them.

```ts
import { createTestSuite, feature, scenario, todo } from "@antischematic/leftest"
import steps from "./steps"

const { given, when, then, examples } = createTestSuite(steps, { // <7> 
   typeCheck: false // <8>
})

~todo
feature('Guess the word', () => { // <1>
   scenario('Maker starts a game', () => { // <2>
      when('the Maker starts a game') // <3>
      then('the Maker waits for a Breaker to join') // <3>
   })
})

~todo // <9>
feature('Cucumbers', () => { // <1>
   background(() => { // <6>
      given('I login with <username> and <password>')
   })
   
   scenario('eating', () => { // <2>
      given('there are <start> cucumbers') // <4>
      when('I eat <eat> cucumbers') // <4>
      then('I should have <left> cucumbers') // <4>

      examples([ // <5>
         { username: 'Bob', password: 'pass', start: 12, eat: 5, left: 7 },
         { username: 'Bob', password: 'pass', start: 20, eat: 5, left: 15 },
      ])
   })
})
```

1. Tests are organised by `feature`
2. Each feature has at least one `scenario`.
3. Scenarios are described using steps, such as `given`, `when` and `then`.
4. Steps can be parameterised to test different states.
5. Scenarios can be repeated using `examples` to iterate over a list of data for a set of parameterised steps.
6. Common steps can be repeated for every scenario using `background`.
7. The test suite is created based on the steps that are provided.
8. Once you have finished implementing the feature, remove this to enable type checking.
9. Remove the `todo` tag to enable the test.
