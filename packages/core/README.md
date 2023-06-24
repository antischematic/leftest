# @antischematic/leftest

Shift-Left testing for JavaScript.

## Setup

```bash
npm add @antischematic/leftest
```

## Usage

Create a `TestSuiteAdapter` for your favourite testing library.

```ts
import {
   createTestSuiteFactory,
   TestSuiteAdapter,
   Flag,
} from "@antischematic/leftest"
import { suite, test } from "vitest"

export class VitestAdapter implements TestSuiteAdapter {
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
   }

   afterScenario(impl: () => void): void {
      console.log('after scenario')
   }

   beforeStep(impl: () => void): void {
      console.log('before step')
   }

   afterStep(impl: () => void): void {
      console.log('after step')
   }
}

export const configure = configureFactory(new CustomAdapter())
```

Then call `configure` in your test suite. That's it!

---

Made a new test suite adapter? Pull requests welcome!
