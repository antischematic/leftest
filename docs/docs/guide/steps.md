---
sidebar_position: 3
---

# Steps

:::info

This API is stable.

:::

The step file should be initially created as an empty object. As you work on features you will implement each step here. These should match the steps defined by `given`, `when`, `then`, `and` and `but` methods in the feature file.

## Add a basic step

```ts
export default {
   'the Maker starts a game': () => {
      console.log('Maker started the game')
   }
}
```

The implementation details of the step are test framework specific. It is up to you to decide what each step does.

## Add a parameterised step

```ts
export default {
   'I eat <eat> cucumbers': (amount: number) => {
      console.log(`I ate ${amount} cucumbers`)
   }
}
```

Steps are parameterised using angle brackets `<>` to delimit the name of the variable. There are multiple ways to use a parameterised step.

### Passing in parameters

```ts
when('I eat <eat> cucumbers', 10) 
```

### Using inline parameters

```ts
when('I eat [10] cucumbers') // 10 is parsed as a number
when('I eat "10" cucumbers') // 10 is parsed as a string
```

Parameters are parsed as strings when delimited with single or double quotes `""` or `''`, and as literal values when delimited with square brackets `[]`.

:::note

Inline parameters make it harder to locate the step implementation.

:::

### Passing in parameters through examples

```ts
when('I eat <eat> cucumbers')
examples([
   { eat: 5 },
   { eat: 10 },
]) 
```

### Using an alias

To avoid naming conflicts, parameters can be renamed with an alias.

:::note
Aliased parameters are not type checked when used with `examples`.
:::

```ts
when('I eat <munch> cucumbers')
examples([
   { munch: 5 },
   { munch: 10 },
]) 
```

## Common steps

Steps for common operations like user authentication or page navigation can be extracted into a common steps file.

```ts
export default {
   'I login with <username> and <password>': (username: string, password: string) => {
      console.log('login:', username, password)
   },
   'I visit <page>': (page: string) => {
      console.log('visit:', page)
   }
}
```

Steps can be easily combined using the spread operator.

```ts
import commonSteps from "./common"

export default {
   ...commonSteps,
   'the Maker starts a game': () => {
      console.log('Maker started the game')
   }
}
```
