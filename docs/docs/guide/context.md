---
sidebar_position: 4
---

# Context

:::caution

This API is experimental.

:::

To share state between steps, use `createTestContext`.

```ts
interface TestState {
   game: Game
}

const ctx = createTestContext<TestState>()

export default {
   'the Maker starts a game': () => {
      ctx.game = new Game()
   },
   'the Maker waits for a Breaker to join': () => {
      ctx.game.waitForBreaker()
   }
}
```

The context state is reset after each scenario. Attempting to access a context property that isn't set will throw an error.
