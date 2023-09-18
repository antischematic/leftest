import { feature, Flag, scenario, setAdapter } from "@antischematic/leftest"
import { afterEach, describe, expect } from "vitest"
import { VitestAdapter } from "./adapter.example"
import { TestAdapter } from "./test-adapter"

const noop = () => {}

const contextError = (method: string, expected: string) => new Error(`"${method}" can only be used in a ${expected} context`)

describe('feature', () => {
   afterEach(() => {
      setAdapter(undefined as any)
   })

   it('should throw when using feature incorrectly', () => {
      setAdapter(new TestAdapter())
      expect(() => {
         feature('allowed', () => {
            feature('not allowed', noop)
         })
      }).toThrow(contextError('feature', 'root'))
      expect(() => {
         feature('allowed', () => {
            scenario('not allowed', () => {
               feature('not allowed', noop)
            })
         })
      }).toThrow(contextError('feature', 'root'))
   })

   it('should create a suite', () => {
      const adapter = new TestAdapter()
      const spy = vi.spyOn(adapter, 'suite')
      setAdapter(adapter)
      feature('feature', noop)

      expect(spy).toHaveBeenCalledWith('feature', expect.any(Function), Flag.DEFAULT)
      expect(spy).toHaveBeenCalledOnce()
   })
})
