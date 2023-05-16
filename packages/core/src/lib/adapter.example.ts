import { suite, test, beforeAll, afterAll, beforeEach, afterEach } from "vitest"
import { Flag, TestSuiteAdapter } from "./types"

export class VitestAdapter implements TestSuiteAdapter {
   suite(name: string, impl: () => void, flag: Flag): void {
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

   test(name: string, impl: () => void): void {
      test(name, impl)
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
