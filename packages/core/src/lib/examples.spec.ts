import { createTestSuite, feature, Flag, scenario, setAdapter } from "@antischematic/leftest"
import { describe, expect } from "vitest"
import { TestAdapter } from "./test-adapter"

const contextError = (method: string, expected: string) => new Error(`"${method}" can only be used in a ${expected} context`)

describe('examples', () => {
   it('should throw when using feature incorrectly', () => {
      setAdapter(new TestAdapter())
      const { examples } = createTestSuite({})
      expect(() => {
         feature('allowed', () => {
            examples('not allowed', [])
         })
      }).toThrow(contextError('examples', 'scenario'))
      expect(() => {
         examples('not allowed', [])
      }).toThrow(contextError('examples', 'scenario'))
   })

   it('should create a test per example', () => {
      const adapter = new TestAdapter()
      const suite = vi.spyOn(adapter, 'suite')
      const test = vi.spyOn(adapter, 'test')
      const steps = {
         'step': () => {}
      }
      const { given, examples } = createTestSuite(steps)
      setAdapter(adapter)
      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
            examples([{}, {}, {}] as any)
         })
      })

      expect(suite).toHaveBeenCalledWith('feature', expect.any(Function), Flag.DEFAULT)
      expect(suite).toHaveBeenCalledWith('scenario', expect.any(Function), Flag.DEFAULT)
      expect(test).toHaveBeenCalledWith('Example 1 of 3', expect.any(Function), expect.any(Object))
      expect(test).toHaveBeenCalledWith('Example 2 of 3', expect.any(Function), expect.any(Object))
      expect(test).toHaveBeenCalledWith('Example 3 of 3', expect.any(Function), expect.any(Object))
      expect(suite).toHaveBeenCalledTimes(2)
      expect(test).toHaveBeenCalledTimes(3)
   })

   it('should throw when using multiple examples without description', () => {
      const adapter = new TestAdapter()
      const { examples } = createTestSuite({}, { typeCheck: false })
      setAdapter(adapter)

      expect(() => {
         feature('feature', () => {
            scenario('scenario', () => {
               examples([])
               examples([])
            })
         })
      }).toThrow('Example description cannot be blank when a scenario has multiple "examples()"')
   })

   it('should throw when using multiple examples with the same description', () => {
      const adapter = new TestAdapter()
      const { examples } = createTestSuite({}, { typeCheck: false })
      setAdapter(adapter)

      expect(() => {
         feature('feature', () => {
            scenario('scenario', () => {
               examples('description', [])
               examples('description', [])
            })
         })
      }).toThrow('Multiple examples detected: "description". Each "examples()" in a scenario must have a unique description')
   })

   it('should create an async test per example', async () => {
      const adapter = new TestAdapter(true)
      const suite = vi.spyOn(adapter, 'suite')
      const test = vi.spyOn(adapter, 'test')
      const steps = {
         'step': () => {}
      }
      const { given, examples } = createTestSuite(steps)
      setAdapter(adapter)
      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
            examples([{}, {}, {}] as any)
         })
      })

      expect(suite).toHaveBeenCalledWith('feature', expect.any(Function), Flag.DEFAULT)
      expect(suite).toHaveBeenCalledWith('scenario', expect.any(Function), Flag.DEFAULT)
      expect(test).toHaveBeenCalledWith('Example 1 of 3', expect.any(Function), expect.any(Object))
      expect(test).toHaveBeenCalledWith('Example 2 of 3', expect.any(Function), expect.any(Object))
      expect(test).toHaveBeenCalledWith('Example 3 of 3', expect.any(Function), expect.any(Object))
      expect(suite).toHaveBeenCalledTimes(2)
      expect(test).toHaveBeenCalledTimes(3)

      await adapter.waitForDone()
   })
})
