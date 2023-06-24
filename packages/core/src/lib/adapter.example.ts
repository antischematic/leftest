import { suite, test } from "vitest"
import { Flag, TestSuiteAdapter } from "./types"

export class VitestAdapter implements TestSuiteAdapter {
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

   test(name: string, impl: () => void, flag: Flag): void {
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
   }

   afterScenario(impl: () => void): void {
      console.log('after scenario')
   }

   beforeStep(impl: () => void): void {
      console.log('before step')
   }

   afterStep(impl: () => void): void {
      console.log('after step')
   }
}
