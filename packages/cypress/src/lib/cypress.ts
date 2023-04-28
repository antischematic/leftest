import { createTestSuiteFactory, TestSuiteAdapter } from "@antischematic/leftest-core"

import { describe, it, Context } from "mocha"

class CypressTestSuiteAdapter implements TestSuiteAdapter {
   createSuite(name: string, impl: () => void): void {
      describe(name, impl)
   }

   createTest(name: string, impl: () => void): void {
      it(name, impl)
   }

   skipTest(context: Context): void {
      context.skip()
   }
}

export const createTestSuite = createTestSuiteFactory(new CypressTestSuiteAdapter())
