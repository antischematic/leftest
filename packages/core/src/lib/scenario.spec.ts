import {
   afterScenario, beforeScenario,
   createTestSuite,
   feature,
   Flag, getAllScenarios, getTags,
   scenario,
   setAdapter,
   TestSuiteAdapterMetadata,
} from "@antischematic/leftest"
import { createSteps } from "@antischematic/leftest-playwright"
import { examples } from "nx/src/command-line/examples"
import { afterEach, describe, expect } from "vitest"
import { VitestAdapter } from "./adapter.example"
import { TestAdapter } from "./test-adapter"

const noop = () => {}

const contextError = (method: string, expected: string) => new Error(`"${method}" can only be used in a ${expected} context`)

const anyMetadata = (): TestSuiteAdapterMetadata => ({
   flag: expect.any(Number),
   steps: expect.any(Array),
   afterScenario: expect.any(Array),
   afterStep: expect.any(Array),
   beforeStep: expect.any(Array),
   beforeScenario: expect.any(Array),
})

describe('feature', () => {
   afterEach(setAdapter)

   it('should throw when using scenario incorrectly', () => {
      setAdapter(new TestAdapter())
      expect(() => {
         scenario('not allowed', noop)
      }).toThrow(contextError('scenario', 'feature'))
      expect(() => {
         feature('allowed', () => {
            scenario('allowed', () => {
               scenario('not allowed', noop)
            })
         })
      }).toThrow(contextError('scenario', 'feature'))
   })

   it('should create a test', () => {
      const adapter = new TestAdapter()
      const spy = vi.spyOn(adapter, 'test')
      setAdapter(adapter)
      feature('feature', () => {
         scenario('scenario', noop)
      })

      expect(spy).toHaveBeenCalledWith('scenario', expect.any(Function), anyMetadata())
      expect(spy).toHaveBeenCalledOnce()
   })

   it('should create a suite', () => {
      const adapter = new TestAdapter()
      const spy = vi.spyOn(adapter, 'suite')
      const { examples } = createTestSuite({})
      setAdapter(adapter)
      feature('feature', () => {
         scenario('scenario', () => {
            examples([{}] as any)
         })
      })

      expect(spy).toHaveBeenCalledWith('feature', expect.any(Function), Flag.DEFAULT)
      expect(spy).toHaveBeenCalledWith('scenario', expect.any(Function), Flag.DEFAULT)
      expect(spy).toHaveBeenCalledTimes(2)
   })

   it('should throw when multiple scenarios with same description are detected', () => {
      const adapter = new TestAdapter()
      setAdapter(adapter)

      expect(() => {
         feature('feature', () => {
            scenario('scenario', noop)
            scenario('scenario', noop)
         })
      }).toThrow('Multiple scenarios detected: "scenario". Each "scenario()" in a feature must have a unique description')
   })

   it('should mark the scenario as failed', () => {
      const adapter = new TestAdapter()
      vi.spyOn(adapter, 'step')
      const spy = vi.fn()
      const { given } = createTestSuite({
         'step': () => {
            throw new Error('bogus')
         }
      })
      setAdapter(adapter)
      afterScenario(spy)
      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
         })
      })
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ failed: true }))
      expect(adapter.thrownError).toEqual(new Error('bogus'))
   })

   it('should skip if previous step failed', () => {
      const adapter = new TestAdapter()
      vi.spyOn(adapter, 'step')
      const spy = vi.fn()
      const { given } = createTestSuite({
         'step': () => {
            throw new Error('bogus')
         }
      })
      setAdapter(adapter)
      afterScenario(spy)
      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
            given('step')
         })
      })
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ failed: true }))
      expect(adapter.thrownError).toEqual(new Error('Previous step failed'))
   })

   it('should skip if previous async step failed', async () => {
      const adapter = new TestAdapter(true)
      vi.spyOn(adapter, 'step')
      const spy = vi.fn()
      const { given } = createTestSuite({
         'step': () => {
            throw new Error('bogus')
         }
      })
      setAdapter(adapter)
      afterScenario(spy)
      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
            given('step')
         })
      })

      await adapter.waitForDone()

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ failed: true }))
      expect(adapter.thrownError).toEqual(new Error('Previous step failed'))
   })

   it('should create an async suite', async () => {
      const adapter = new TestAdapter(true)
      const spy = vi.spyOn(adapter, 'suite')
      const { examples } = createTestSuite({})
      setAdapter(adapter)
      feature('feature', () => {
         scenario('scenario', () => {
            examples('examples', [{}] as any)
         })
      })

      expect(spy).toHaveBeenCalledWith('feature', expect.any(Function), Flag.DEFAULT)
      expect(spy).toHaveBeenCalledWith('scenario', expect.any(Function), Flag.DEFAULT)
      expect(spy).toHaveBeenCalledWith('examples', expect.any(Function), Flag.DEFAULT)
      expect(spy).toHaveBeenCalledTimes(3)

      await adapter.waitForDone()
   })

   it('should mark the async scenario as failed', async () => {
      const adapter = new TestAdapter(true)
      vi.spyOn(adapter, 'step')
      const spy = vi.fn()
      const { given } = createTestSuite({
         'step': () => {
            throw new Error('bogus')
         }
      })
      setAdapter(adapter)
      afterScenario((scenario) => {
         spy(scenario)
      })
      feature('feature', () => {
         scenario('scenario', () => {
            given('step')
         })
      })
      await adapter.waitForDone()
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ failed: true }))
      expect(adapter.thrownError).toEqual(new Error('bogus'))
   })

   it('should get all scenarios', () => {
      const adapter = new TestAdapter(false)
      setAdapter(adapter)

      feature('feature', () => {
         scenario('scenario', noop)
         scenario('scenario2', noop)
      })

      expect(getAllScenarios()).toEqual(expect.arrayContaining([
         expect.objectContaining({ name: 'scenario' }),
         expect.objectContaining({ name: 'scenario2' })
      ]))
   })

   it('should have metadata', () => {
      const spy = vi.fn()
      const adapter = new TestAdapter()
      const { featureTag, scenarioTag } = getTags()
      setAdapter(adapter)

      beforeScenario((scenario) => {
         expect(scenario.name).toBe('scenario')
         expect(scenario.path).toEqual(['feature', 'scenario'])
         expect(scenario.hasOwnTag(featureTag)).toBe(false)
         expect(scenario.hasTag(featureTag)).toBe(true)
         expect(scenario.hasOwnTag(scenarioTag)).toBe(true)
         expect(scenario.hasTag(scenarioTag)).toBe(true)
         spy()
      })

      ~featureTag
      feature('feature', () => {
         ~scenarioTag
         scenario('scenario', noop)
      })

      expect(spy).toHaveBeenCalledOnce()
   })
})
