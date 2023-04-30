import { createTestSuiteFactory, Flag, TestSuiteAdapter } from "@antischematic/leftest-core"

import { Context } from "mocha"

class CypressTestSuiteAdapter implements TestSuiteAdapter {
   createSuite(name: string, impl: () => void, flag: Flag): void {
      switch (flag) {
         case Flag.SKIP:
            describe.skip(name, impl)
            break
         case Flag.ONLY:
            describe.only(name, impl)
            break
         case Flag.DEFAULT:
            describe(name, impl)
      }
   }

   createTest(name: string, impl: () => void): void {
      it(name, impl)
   }

   skipTest(context: Context): void {
      context.skip()
   }
}

export const createTestSuite = createTestSuiteFactory(new CypressTestSuiteAdapter())
