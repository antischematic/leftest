import { createTestSuiteFactory } from "./core"
import { suite, test } from "vitest"
import { TestSuiteAdapter } from "./types"

class VitestAdapter implements TestSuiteAdapter {
   createSuite(name: string, impl: () => void): void {
      suite(name, impl)
   }

   createTest(name: string, impl: () => void): void {
      test(name, impl)
   }
}

export const createTestSuite = createTestSuiteFactory(new VitestAdapter())
