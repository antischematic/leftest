import { createTestSuiteFactory, TestSuiteAdapter } from "leftest-core"

import { suite, test, Context } from "mocha"

class CypressTestSuiteAdapter implements TestSuiteAdapter {
   createSuite(name: string, impl: () => void): void {
      suite(name, impl)
   }

   createTest(name: string, impl: () => void): void {
      test(name, impl)
   }

   skipTest(context: Context): void {
      context.skip()
   }
}

export const createTestSuite = createTestSuiteFactory(new CypressTestSuiteAdapter())
