import {
   Flag,
   setAdapter,
   setTags,
   TestSuiteAdapter,
} from "@antischematic/leftest"

import { Context } from "mocha"

export class CypressTestSuiteAdapter implements TestSuiteAdapter {
   suite(name: string, impl: () => void, flag: Flag): void {
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

   test(name: string, impl: () => void): void {
      it(name, impl)
   }

   skip(context: Context): void {
      context.skip()
   }

   beforeSuite(impl: () => void): void {
      before(impl)
   }

   beforeTest(impl: () => void): void {
      beforeEach(impl)
   }

   afterSuite(impl: () => void): void {
      after(impl)
   }

   afterTest(impl: () => void): void {
      afterEach(impl)
   }
}

setAdapter(new CypressTestSuiteAdapter())
setTags(Cypress.env("LEFTEST_TAGS") ?? "")
