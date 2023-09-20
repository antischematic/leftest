---
sidebar_position: 4
---

# Write a Custom Adapter

:::caution

This API is experimental.

:::

## Setup

Install the core Leftest library.

```bash
npm add @antischematic/leftest
```

## Usage

Create an adapter for your testing library. This example uses Vitest.

```ts
import {
   createTestSuiteFactory,
   setAdapter,
   TestSuiteAdapter,
   TestSuiteAdapterMetadata,
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

   test(name: string, impl: () => void, { flag }: TestSuiteAdapterMetadata): void {
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

Then import the adapter into your test suite.
