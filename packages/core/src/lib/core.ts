import { Flag } from "./types"
import type { TestSuite, TestSuiteAdapter, TestSuiteOptions } from "./types"

function stripDelimiters(string: string) {
   return string.slice(1, string.length - 1)
}

function getValue(expr: string) {
   switch (expr) {
      case "true":
         return true
      case "false":
         return false
      case "null":
         return null
      case "undefined":
         return undefined
      default:
         return Number(expr)
   }
}

function normalize(step: string) {
   return step.replace(
      /('[^\s]*?'|"[^\s]*?"|<[^\s]*?>|\[[^\s]*?\])/g,
      "%%var%%",
   )
}

function parseArguments(step: string, args: readonly any[], steps: Steps) {
   // eg. "foo[20]bar" = ["foo", "[20]", "bar"]
   const tokens = step.split(/(\[[^\s]*?\]|'[^\s]*?'|"[^\s]*?")|\[[^\s]*?\]/)
   const parsedArgs = [] as unknown[]
   tokens.forEach((value) => {
      const expr = stripDelimiters(value)
      switch (value.slice(-1)) {
         case "]":
            parsedArgs.push(getValue(expr))
            break
         case "'":
         case '"':
            parsedArgs.push(expr)
      }
   })
   return parsedArgs
}

class Scenario {
   failed = false
   steps: any[] = []
   examples: any[] = []

   addStep(factory: () => void): void {
      this.steps.push(factory)
   }

   addExamples(data: any[]) {
      this.examples.push(data)
   }

   markAsFailed() {
      this.failed = true
   }

   constructor(public name: string) {}
}

interface Context {
   scenario: Scenario
   examples: readonly any[]
   data?: any
}

const rootScenario: Scenario = new Scenario("root")

rootScenario.addStep = function () {
   throw new Error("Steps can only be added inside a scenario")
}

let context: Context = {
   scenario: rootScenario,
   examples: Object.freeze([]),
}

function setContext(nextContext: Context) {
   const previousContext = context
   context = nextContext
   return previousContext
}

function runSteps(
   combinedSteps: any[],
   scenario: Scenario,
   examples: readonly any[],
   data?: any,
) {
   const previousExample = setContext({
      scenario,
      examples,
      data,
   })
   try {
      for (const step of combinedSteps) {
         step()
      }
   } finally {
      setContext(previousExample)
   }
}

function getFlag(tags: Set<any>): Flag {
   if (tags.has(`${skip}`)) {
      return Flag.SKIP
   }
   if (tags.has(`${only}`)) {
      return Flag.ONLY
   }
   return Flag.DEFAULT
}

function createScenario(adapter: TestSuiteAdapter) {
   return function scenario(name: string, fn: () => void) {
      const flag = getFlag(flushTags())
      const backgroundSteps = context.scenario.steps
      adapter.createSuite(name, function () {
         const scenario = new Scenario(name)
         const previous = setContext({
            scenario,
            examples: [],
         })
         try {
            fn()
            const combinedSteps = [...backgroundSteps, ...scenario.steps]
            if (!scenario.examples.length) {
               runSteps(combinedSteps, context.scenario, context.examples)
            } else {
               for (const examples of scenario.examples) {
                  const len = examples.length
                  for (const [index, data] of examples.entries()) {
                     const exampleScenario = new Scenario(index)
                     adapter.createSuite(
                        `Example ${index + 1} of ${len}`,
                        () => {
                           runSteps(combinedSteps, exampleScenario, [], data)
                        },
                        Flag.DEFAULT
                     )
                  }
               }
            }
         } finally {
            setContext(previous)
         }
      }, flag)
   }
}

function createFeature(adapter: TestSuiteAdapter) {
   return function feature(name: string, fn: () => void) {
      const flag = getFlag(flushTags())

      adapter.createSuite(name, () => {
         const scenario = new Scenario(name)
         const previous = setContext({
            scenario,
            examples: [],
         })
         try {
            fn()
         } finally {
            setContext(previous)
         }
      }, flag)
   }
}

function background(fn: () => void) {
   flushTags()
   fn()
}

function examples(data: any[]) {
   flushTags()
   context.scenario.addExamples(data)
}

function createStep(steps: Steps, adapter: TestSuiteAdapter) {
   return function step(name: string, step: string, ...args: readonly any[]) {
      flushTags()
      context.scenario.addStep(() => {
         let parsedArgs = args as any[]
         if (!parsedArgs.length) {
            parsedArgs = parseArguments(step, args, steps)
         }
         if (!parsedArgs.length) {
            parsedArgs = steps.getArgsFromObject(step, context.data)
         }
         if (!parsedArgs.length && steps.hasArgs(step)) {
            throw new Error("Args missing")
         }
         const testName = steps.getTestName(step, parsedArgs)
         const impl = steps.getImplementation(step)
         const { scenario } = context
         if (testName) {
            adapter.createTest(
               `${name} ${testName}`,
               function (this: any) {
                  if (scenario.failed) {
                     if (adapter.skipTest) {
                        adapter.skipTest(this)
                     } else {
                        throw new Error("Previous step failed")
                     }
                  }
                  try {
                     impl(...parsedArgs)
                  } catch (e) {
                     scenario.markAsFailed()
                     throw e
                  }
               },
            )
         }
      })
   }
}

function splitVars(name: string) {
   return (name.split(/(<[^\s]*?>)/g) ?? []).map((s) =>
      s.startsWith("<") ? { var: stripDelimiters(s) } : s,
   )
}

function expandSteps(list: any[]): any[] {
   return list.flatMap((item) => Object.entries(item))
}

class Steps {
   normalNames: Record<
      string,
      { name: string; vars: any[]; impl: (...args: any[]) => void }
   >

   getTestName(step: string, args: readonly any[]) {
      const copy = args.slice(0)
      return (
         this.normalNames[normalize(step)]?.vars
            .map((s) => {
               if (typeof s === "string") {
                  return s
               } else {
                  const val = copy.shift()
                  if (this.options.stringifyPlaceholderArguments) {
                     return JSON.stringify(val)
                  } else {
                     return typeof val === "string" ? val : Array.isArray(val) ? val.join() : val
                  }
               }
            })
            .join("") ?? ""
      )
   }

   getImplementation(step: string) {
      return this.normalNames[normalize(step)]?.impl
   }

   getArgsFromObject(step: string, data: Record<string, unknown>) {
      return (
         this.normalNames[normalize(step)]?.vars
            .filter((s) => !(typeof s === "string"))
            .map((s) => data[s.var]) ?? []
      )
   }

   hasArgs(step: string) {
      return this.normalNames[normalize(step)]?.vars.length > 1
   }

   constructor(private steps: any, private options: TestSuiteOptions) {
      this.normalNames = {}

      for (const [name, impl] of Object.entries(steps)) {
         this.normalNames[normalize(name)] = {
            name,
            vars: splitVars(name),
            impl: impl as (...args: any[]) => void,
         }
      }
   }
}

const tags = [] as any[]

function flushTags(): Set<string> {
   const flushed = new Set(tags)
   tags.length = 0
   return flushed
}

export function createTags(): { [key: string]: any } {
   return new Proxy({}, {
      get(t, p) {
         return {
            [Symbol.toPrimitive](hint: string) {
               tags.push(p)
               if (hint === "string" || hint === "default") {
                  return p
               }
               return 0
            }
         }
      }
   })
}

let registeredTags = [] as any

export function registerTags(tags: string[]) {
   registeredTags = tags
}

export const { only, skip } = createTags()

export function createTestSuiteFactory(adapter: TestSuiteAdapter) {
   function createTestSuite(): TestSuite<any>
   function createTestSuite<T extends object>(
      options: { default: T } & TestSuiteOptions,
   ): TestSuite<T>
   function createTestSuite<T extends object>(
      steps: T,
      options?: TestSuiteOptions,
   ): TestSuite<T>
   function createTestSuite<T extends object>(
      stepsOrOptions?: {
         default?: T
         steps?: T
      } & TestSuiteOptions,
      options: TestSuiteOptions = stepsOrOptions ?? {},
   ): TestSuite<any> {
      options.stringifyPlaceholderArguments ??= true
      const steps = new Steps(
         arguments.length > 1
            ? stepsOrOptions
            : stepsOrOptions?.default ?? stepsOrOptions,
         options
      )
      const step = createStep(steps, adapter)
      const feature = createFeature(adapter)
      const scenario = createScenario(adapter)

      return {
         given: step.bind(null, "Given"),
         when: step.bind(null, "When"),
         then: step.bind(null, "Then"),
         and: step.bind(null, "And"),
         but: step.bind(null, "But"),
         examples,
         feature,
         scenario,
         background,
         describe: feature,
         suite: scenario,
      } as any
   }

   return createTestSuite
}
