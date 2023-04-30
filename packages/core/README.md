# @antischematic/leftest-core

Shift-Left testing for JavaScript.

## Installation

```bash
npm add @antischematic/leftest-core
```

## Usage

Create a `TestSuiteAdapter` for your favourite testing library.

```ts
import {
   createTestSuiteFactory,
   TestSuiteAdapter,
   Flag
} from "@antischematic/leftest-core"
import { suite, test } from "vitest"

class VitestAdapter implements TestSuiteAdapter {
   createSuite(name: string, impl: () => void, flag: Flag): void {
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

   createTest(name: string, impl: () => void): void {
      test(name, impl)
   }

   skipTest(): void {
      // add library specific hook for skipping tests after an error
      // optional, throws error by default
   }
}

export const createTestSuite = createTestSuiteFactory(new VitestAdapter())
```

Then import your `createTestSuite` implementation into your feature files. That's it!

```ts
import { createTestSuite } from "leftest-custom"

const { feature, scenario, given, when, then, and, but, examples, background } =
   createTestSuite()
```

---

Made a new test suite adapter? Pull requests welcome!
