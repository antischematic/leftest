import {
   background,
   createTestSuite,
   feature,
   Flag,
   scenario,
   setAdapter,
} from "@antischematic/leftest"
import { afterEach, describe, expect } from "vitest"
import { VitestAdapter } from "./adapter.example"
import { TestAdapter } from "./test-adapter"

const noop = () => {}

const contextError = (method: string, expected: string) => new Error(`"${method}" can only be used in a ${expected} context`)

describe('background', () => {
   afterEach(() => {
      setAdapter(undefined as any)
   })

   it('should throw when using feature incorrectly', () => {
      setAdapter(new TestAdapter())
      expect(() => {
         background(noop)
      }).toThrow(contextError('background', 'feature'))
      expect(() => {
         feature('allowed', () => {
            scenario('not allowed', () => {
               background(noop)
            })
         })
      }).toThrow(contextError('background', 'feature'))
   })

   it('should create add background to each scenario', () => {
      const adapter = new TestAdapter()
      const steps = {
         'background': vi.fn(),
         'step A': vi.fn(),
         'step B': vi.fn()
      }
      const { given, when } = createTestSuite(steps)
      setAdapter(adapter)

      feature('feature', () => {
         background(() => {
            given('background')
         })

         scenario('scenario A', () => {
            when('step A')
         })

         scenario('scenario B', () => {
            when('step B')
         })
      })

      expect(steps.background).toHaveBeenCalledTimes(2)
      expect(steps["step A"]).toHaveBeenCalledOnce()
      expect(steps["step B"]).toHaveBeenCalledOnce()
   })
})
