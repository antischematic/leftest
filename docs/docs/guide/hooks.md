---
sidebar_position: 4
---

# Hooks

:::info

This API is stable.

:::

:::tip

Keep hooks separate from your feature specs. Keep them in a separate file, or together with your steps.

:::

Hooks allow you execute code before or after each scenario or step runs. This can be useful for recording and replaying network traffic, taking screenshots at the end of every test, or setting up interceptors to name a few examples.

## Scenario hooks

```ts
import { beforeScenario, afterScenario } from '@antischematic/leftest'

beforeScenario((scenario) => {
   console.log(scenario.name)
})

afterScenario((scenario) => {
   console.log(scenario.name)
})
```

The `beforeScenario` and `afterScenario` hooks receive a `ReadonlyScenario` argument representing the current scenario that is being executed. The `afterScenario` hook will always run even if the test fails.

## Step hooks

```ts
import { beforeStep, afterStep } from '@antischematic/leftest'

beforeStep((scenario) => {
   console.log(scenario.name)
})

afterStep((scenario) => {
   console.log(scenario.name)
})
```

The `beforeStep` and `afterStep` hooks receive a `ReadonlyScenario` argument representing the current scenario that is being executed.

## Hook execution order

The order of execution for hooks in each scenario are:

1. `beforeScenario` once
2. `beforeStep` once per step
3. `afterStep` once per step
4. `afterScenario` once

Hooks of the same type are run in the order they are declared.

:::tip

Avoid writing hooks that depend on the execution order.

:::
