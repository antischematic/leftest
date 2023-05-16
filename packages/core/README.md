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
import { suite, test, beforeAll, beforeEach, afterAll, afterEach } from "vitest"

class CustomAdapter implements TestSuiteAdapter {
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

   beforeSuite(impl: () => void): void {
      beforeAll(impl)
   }

   afterSuite(impl: () => void): void {
      afterAll(impl)
   }

   beforeTest(impl: () => void): void {
      beforeEach(impl)
   }

   afterTest(impl: () => void): void {
      afterEach(impl)
   }
}

export const configure = configureFactory(new CustomAdapter())
```

Then call `configure` in your test suite. That's it!

---

Made a new test suite adapter? Pull requests welcome!
