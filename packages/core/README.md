# @antischematic/leftest

Shift-Left testing for JavaScript.

## Setup

```bash
npm add @antischematic/leftest
```

## Usage

Create a support file for your favourite testing library.

```ts
import {
   createTestSuiteFactory,
   setAdapter,
   TestSuiteAdapter,
   Flag,
} from "@antischematic/leftest"
import { suite, test } from "vitest"

export class VitestAdapter implements TestSuiteAdapter {
   isAsync = true
   
   suite(name: string, impl: () => void, flag: Flag) {
      switch (flag) {
         case Flag.SKIP:
            suite.skip(name, impl)
            break
         case Flag.ONLY:
            suite.only(name, impl)
            break
         case Flag.DEFAULT:
            suite(name, impl)
      }
   }

   test(name: string, impl: () => void, flag: Flag): void {
      switch (flag) {
         case Flag.SKIP:
            test.skip(name, impl)
            break
         case Flag.ONLY:
            test.only(name, impl)
            break
         case Flag.DEFAULT:
            test(name, impl)
      }
   }

   step(name: string, description: string, impl: () => void): void {
      console.log(name, description)
      impl()
   }

   beforeScenario(impl: () => void): void {
      console.log('before scenario')
      impl()
   }

   afterScenario(impl: () => void): void {
      console.log('after scenario')
      impl()
   }

   beforeStep(impl: () => void): void {
      console.log('before step')
      impl()
   }

   afterStep(impl: () => void): void {
      console.log('after step')
      impl()
   }
}

setAdapter(new VitestAdapter())
```

Then import the support file into your test suite.

## Component harnesses

[Learn about test harnesses here](https://material.angular.io/cdk/test-harnesses)

This library exports a type-compatible API based on the same concepts, without any
 dependencies. It is intended to be used with other web libraries such as React.

### Queries

Additional query helpers are available

- `query`
- `queryBy`
- `queryByRole`
- `queryByText`
- `queryByTitle`
- `queryByLabelText`
- `queryByDisplayValue`
- `queryByTestId`
- `queryByAltText`
- `queryByPlaceholder`

Given the following component

```tsx
function Button({ children }) {
   return <button>
      <i data-testid="button-icon" />
      <span>{ children }</span>
   </button>
}
```

We can locate the icon using a query

```ts
export class ButtonHarness extends ComponentHarness {
   static hostSelector = forRole('button')

   getIcon = this.locatorFor(queryByTestId('button-icon'))
}
```

Component harnesses also expose similar query methods

```ts
export class ButtonHarness extends ComponentHarness {
   static hostSelector = forRole('button')

   getIcon = this.locatorFor(IconHarness.queryByTestId('button-icon'))
}
```

Custom filters can also extend the `Query` class to inherit these filters.

```ts
interface ButtonFilters extends QueryFilters {}

export class ButtonHarness extends ComponentHarness {
   static hostSelector = withRole('button')

   getIcon = this.locatorFor(IconHarness.queryByTestId('button-icon'))
   
   async hasIcon(name: string) {
      const icon = await this.getIcon()
      return icon.matchesSelector(`[data-name="${name}"]`)
   }
   
   static with(filter: ButtonFilters) {
      return new Query(this, filter)
         .addOption('with icon', filter.icon, (harness, icon) => harness.hasIcon(icon))
   }
}
```
