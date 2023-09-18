import {
   createTestSuite,
   feature,
   Flag,
   scenario,
   setAdapter,
   TestSuiteAdapterMetadata,
} from "@antischematic/leftest"
import { describe, expect } from "vitest"
import { TestAdapter } from "./test-adapter"

const contextError = () => new Error(`Steps can only be added inside a scenario, background or examples context`)
const argsError = (step: string, ...expected: string[]) => new Error(`No value given for ${new Intl.ListFormat("en").format(
   expected.map(arg => `"${arg}"`),
)}
   ${step}
`)
const argsLengthError = (step: string, actual: number, expected: number) => new Error(`Expected at least ${expected} arguments, received ${actual}
   ${step}
`)
const missingStepError = (step: string) => new Error(`No step matched:
   ${step}`)

const steps = {
   'not allowed': () => {},
   'allowed': () => {},
   'with args <arg1> <arg2> <arg3>': (arg1: unknown, arg2: unknown, arg3: unknown) => {},
   'with arg <arg1>': (arg1: unknown) => {}
}

describe('steps', () => {
   it('should throw when using steps incorrectly', () => {
      setAdapter(new TestAdapter())
      const { given } = createTestSuite(steps)
      expect(() => {
         given('not allowed')
      }).toThrow(contextError())
      expect(() => {
         feature('allowed', () => {
            given('not allowed')
         })
      }).toThrow(contextError())
   })

   it('should create a step', () => {
      const adapter = new TestAdapter()
      const spy = vi.spyOn(adapter, 'step')
      const { given, when, then, and, but } = createTestSuite(steps)
      setAdapter(adapter)
      feature('feature', () => {
         scenario('scenario', () => {
            given('allowed')
            when('allowed')
            then('allowed')
            and('allowed')
            but('allowed')
         })
      })

      expect(spy).toHaveBeenCalledWith('Given', 'allowed', expect.any(Function), expect.any(Object))
      expect(spy).toHaveBeenCalledWith('When', 'allowed', expect.any(Function), expect.any(Object))
      expect(spy).toHaveBeenCalledWith('Then', 'allowed', expect.any(Function), expect.any(Object))
      expect(spy).toHaveBeenCalledWith('And', 'allowed', expect.any(Function), expect.any(Object))
      expect(spy).toHaveBeenCalledWith('But', 'allowed', expect.any(Function), expect.any(Object))
      expect(spy).toHaveBeenCalledTimes(5)
   })

   it('should throw when arguments are missing', () => {
      const adapter = new TestAdapter()
      const { given, examples } = createTestSuite(steps)
      setAdapter(adapter)

      expect(() => {
         feature('feature', () => {
            scenario('scenario', () => {
               given('with args <arg1> <arg2> <arg3>')
            })
         })
      }).toThrow(argsError('with args <arg1> <arg2> <arg3>','arg1', 'arg2', 'arg3'))

      expect(() => {
         feature('feature', () => {
            scenario('scenario', () => {
               given('with args <arg1> <arg2> <arg3>')
               examples([{ arg1: 'test' }])
            })
         })
      }).toThrow(argsError('with args <arg1> <arg2> <arg3>','arg2', 'arg3'))

      expect(() => {
         feature('feature', () => {
            scenario('scenario', () => {
               given('with args <arg1> <arg2> <arg3>' as any, 123)
            })
         })
      }).toThrow(argsLengthError('with args <arg1> <arg2> <arg3>',1, 3))
   })

   it('should throw when step is not defined', () => {
      const adapter = new TestAdapter()
      const { given } = createTestSuite(steps, { typeCheck: false })
      setAdapter(adapter)

      expect(() => {
         feature('feature', () => {
            scenario('scenario', () => {
               given('does not exist')
            })
         })
      }).toThrow(missingStepError('does not exist'))
   })

   it('should throw when step is ambiguous', () => {
      const steps = {
         'step <first>': () => {},
         'step <ambiguous>': () => {},
      }

      expect(() => {
         createTestSuite(steps)
      }).toThrow(`Ambiguous step detected:
   step <first>
Matches:
   step <ambiguous>`)
   })

   it('should parse string arguments', () => {
      const steps = {
         'with <arg1> <arg2> <arg3> <arg4> <arg5> <arg6> <arg7>': (arg1: string, arg2: number, arg3: boolean, arg4: boolean, arg5: null, arg6: undefined, arg7: string) => {}
      }
      const spy = vi.spyOn(steps, 'with <arg1> <arg2> <arg3> <arg4> <arg5> <arg6> <arg7>')
      const adapter = new TestAdapter()
      const { given } = createTestSuite(steps)
      setAdapter(adapter)

      feature('feature', () => {
         scenario('scenario', () => {
            given('with "hello" [123] [true] [false] [null] [undefined] \'world\'')
         })
      })

      expect(spy).toHaveBeenCalledWith('hello', 123, true, false, null, undefined, 'world')
      expect(spy).toHaveBeenCalledTimes(1)
   })
})
