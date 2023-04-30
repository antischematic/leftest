import { createTestSuiteFactory } from "./core"
import { suite, test } from "vitest"
import { Flag, TestSuiteAdapter } from "./types"

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
}

export const createTestSuite = createTestSuiteFactory(new VitestAdapter())
