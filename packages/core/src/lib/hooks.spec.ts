import {
   afterScenario, afterStep, and,
   beforeScenario,
   beforeStep, createTestSuite, eq,
   feature, Flag, getTags, not, only, or, scenario,
   setAdapter, setTags, skip,
} from "@antischematic/leftest"
import { afterEach, expect } from "vitest"
import { e } from "vitest/dist/types-63abf2e0"
import { TestAdapter } from "./test-adapter"

describe('hooks', () => {
   afterEach(() => {
      setTags([])
   })

   it('should call adapter hooks', () => {
      const adapter = new TestAdapter()
      const spy = vi.fn()
      setAdapter(adapter)
      vi.spyOn(adapter, 'beforeScenario')
      vi.spyOn(adapter, 'afterScenario')
      vi.spyOn(adapter, 'beforeStep')
      vi.spyOn(adapter, 'afterStep')

      beforeScenario(spy)
      afterScenario(spy)
      beforeStep(spy)
      afterStep(spy)

      const { given } = createTestSuite({
         'step': () => {}
      })

      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
         })
      })

      expect(adapter.beforeScenario).toHaveBeenCalledTimes(1)
      expect(adapter.afterScenario).toHaveBeenCalledTimes(1)
      expect(adapter.beforeStep).toHaveBeenCalledTimes(1)
      expect(adapter.afterStep).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenNthCalledWith(1, expect.any(Object))
      expect(spy).toHaveBeenNthCalledWith(2, expect.any(Object))
      expect(spy).toHaveBeenNthCalledWith(3, expect.any(Object))
      expect(spy).toHaveBeenNthCalledWith(4, expect.any(Object))
   })

   it('should call async adapter hooks', async () => {
      const adapter = new TestAdapter(true)
      const spy = vi.fn()
      setAdapter(adapter)
      vi.spyOn(adapter, 'beforeScenario')
      vi.spyOn(adapter, 'afterScenario')
      vi.spyOn(adapter, 'beforeStep')
      vi.spyOn(adapter, 'afterStep')

      beforeScenario(spy)
      afterScenario(spy)
      beforeStep(spy)
      afterStep(spy)

      const { given } = createTestSuite({
         'step': () => {}
      })

      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
         })
      })

      await adapter.waitForDone()

      expect(adapter.beforeScenario).toHaveBeenCalledTimes(1)
      expect(adapter.afterScenario).toHaveBeenCalledTimes(1)
      expect(adapter.beforeStep).toHaveBeenCalledTimes(1)
      expect(adapter.afterStep).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenNthCalledWith(1, expect.any(Object))
      expect(spy).toHaveBeenNthCalledWith(2, expect.any(Object))
      expect(spy).toHaveBeenNthCalledWith(3, expect.any(Object))
      expect(spy).toHaveBeenNthCalledWith(4, expect.any(Object))
   })

   it('should only run scenario', () => {
      const steps = {
         'step': vi.fn()
      }
      const { given } = createTestSuite(steps)
      const adapter = new TestAdapter()
      vi.spyOn(adapter, 'test')
      setAdapter(adapter)

      feature('feature', () => {
         ~only
         scenario('scenario', () => {
            given('step')
         })

         scenario('skipped', () => {
            given('step')
         })
      })

      // We rely on TestSuiteAdapter to properly implement the ONLY flag
      expect(adapter.test).toHaveBeenCalledWith('scenario', expect.any(Function), expect.objectContaining({ flag: Flag.ONLY }))
   })

   it('should skip scenario', () => {
      const steps = {
         'step': vi.fn()
      }
      const { given } = createTestSuite(steps)
      const adapter = new TestAdapter()
      vi.spyOn(adapter, 'test')
      setAdapter(adapter)

      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
         })

         ~skip
         scenario('skipped', () => {
            given('step')
         })
      })

      expect(adapter.test).toHaveBeenCalledWith('scenario', expect.any(Function), expect.objectContaining({ flag: Flag.DEFAULT }))
      expect(adapter.test).toHaveBeenCalledWith('skipped', expect.any(Function), expect.objectContaining({ flag: Flag.SKIP }))
      expect(steps.step).toHaveBeenCalledTimes(1)
   })

   it('should only run hooks on tagged scenario', () => {
      const steps = {
         'step': vi.fn()
      }
      const { given } = createTestSuite(steps)
      const adapter = new TestAdapter()
      const { tag, thisOne, otherTag } = getTags()
      const spy = vi.fn()
      setAdapter(adapter)

      beforeScenario(or(and(eq(tag), not(thisOne)), eq(otherTag)), spy)

      feature('feature', () => {
         ~tag
         scenario('scenario', () => {
            given('step')
         })

         ~tag
         ~thisOne
         scenario('skipped', () => {
            given('step')
         })
      })

      expect(spy).toHaveBeenCalledTimes(1)
   })

   it('should exclude scenarios that don\'t match tag filter', () => {
      const steps = {
         'step': vi.fn()
      }
      const { given } = createTestSuite(steps)
      const adapter = new TestAdapter()
      const { tag, thisOne } = getTags()
      setAdapter(adapter)
      setTags('tag, ^thisOne')

      feature('feature', () => {
         ~tag
         scenario('scenario', () => {
            given('step')
         })

         ~tag
         ~thisOne
         scenario('skipped', () => {
            given('step')
         })
      })

      expect(steps.step).toHaveBeenCalledTimes(1)

   })
})

