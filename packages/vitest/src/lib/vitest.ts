import {
   Flag,
   setAdapter, setTags,
   TestSuiteAdapter,
   TestSuiteAdapterMetadata,
} from "@antischematic/leftest"

import { suite, test } from "vitest"

export class VitestTestSuiteAdapter implements TestSuiteAdapter {
   isAsync = true

   afterScenario(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      test('After Scenario', impl)
   }

   afterStep(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      test('After Step', impl)
   }

   beforeScenario(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      test('Before Scenario', impl)
   }

   beforeStep(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      test('Before Step', impl)
   }

   step(name: string, description: string, impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      test(`${name} ${description}`, impl)
   }

   suite(name: string, impl: () => void, flag: Flag): void {
      switch (flag) {
         case Flag.ONLY: {
            suite.only(name, impl)
            break
         }
         case Flag.SKIP: {
            suite.skip(name, impl)
            break
         }
         case Flag.DEFAULT: {
            suite(name, impl)
         }
      }
   }

   test(name: string, impl: (context?: any) => void, { flag }: TestSuiteAdapterMetadata): void {
      switch (flag) {
         case Flag.ONLY: {
            suite.only(name, impl)
            break
         }
         case Flag.SKIP: {
            suite.skip(name, impl)
            break
         }
         case Flag.DEFAULT: {
            suite(name, impl)
         }
      }
   }
}

setAdapter(new VitestTestSuiteAdapter())
setTags(process.env['LEFTEST_TAGS'] ?? '')
