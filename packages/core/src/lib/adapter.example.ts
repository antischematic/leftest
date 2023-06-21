import { suite, test, beforeAll, afterAll, beforeEach, afterEach } from "vitest"
import { Flag, TestSuiteAdapter } from "./types"

export class VitestAdapter implements TestSuiteAdapter {
   inlineHooks = true

   feature(name: string, impl: () => void, flag: Flag) {
      this.useSuite(name, impl, flag)
   }

   scenario(name: string, impl: () => void, flag: Flag): void {
      this.useSuite(name, impl, flag)
   }

   example(name: string, impl: () => void, flag: Flag) {
      this.useSuite(name, impl, flag)
   }

   step(name: string, description: string, impl: () => void): void {
      test(description, impl)
   }

   beforeScenario(impl: () => void): void {
      beforeAll(impl)
   }

   afterScenario(impl: () => void): void {
      afterAll(impl)
   }

   beforeStep(impl: () => void): void {
      beforeEach(impl)
   }

   afterStep(impl: () => void): void {
      afterEach(impl)
   }

   private useSuite(name: string, impl: () => void, flag: Flag) {
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
}
