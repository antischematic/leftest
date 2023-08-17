import { afterEach, describe, expect } from "vitest"
import { clearTestContext, createTestContext } from "./context"

const context = createTestContext<{ bogus: boolean }>()

describe("ref", () => {
   afterEach(clearTestContext)

   it("should create ref", () => {
      context.bogus = true

      expect(context.bogus).toBe(true)
   })

   it("should throw when value not set", () => {
      expect(() => context.bogus).toThrow("Cannot access context value \"bogus\" before it has been set")
   })
})
