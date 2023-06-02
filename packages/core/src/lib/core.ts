import type { Tag, TagFilter, TestSuite, TestSuiteAdapter, TestSuiteOptions } from "./types"
import { Flag, ReadonlyScenario } from "./types"

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

function parseArguments(step: string) {
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

enum Type {
   ROOT = "root",
   FEATURE = "feature",
   SCENARIO = "scenario",
   EXAMPLE = "examples",
}

export class Scenario {
   data: { [key: string]: unknown } = {}
   // `true` when one of a scenario's steps have failed
   failed = false
   // `true` when one of a scenario's steps have failed
   steps: any[] = []
   examples: Map<any[], Set<string>> = new Map()
   scenarios: Map<Scenario, () => void> = new Map()

   addStep(factory: () => void): void {
      this.steps.push(factory)
   }

   addExamples(data: any[], tags: Set<any>) {
      this.examples.set(data, tags)
   }

   addScenario(scenario: Scenario, factory: () => void) {
      this.scenarios.set(scenario, factory)
   }

   markAsFailed() {
      this.failed = true
   }

   getFullName() {
      const parentName: string = this.feature?.getFullName() ?? ""
      return parentName + this.name
   }

   hasOwnTag(tag: Tag) {
      return this.tags.has(tag.name)
   }

   hasTag(tag: Tag) {
      return this.getEffectiveTags().has(tag.name)
   }

   getEffectiveTags() {
      const tags = [this.feature.tags, this.tags, ...this.examples.values()].flatMap(tags => Array.from(tags))
      return new Set(tags)
   }

   constructor(
      readonly type: Type,
      readonly name: string,
      readonly tags: Set<string>,
      readonly feature: Scenario,
      readonly parent?: Scenario,
   ) {}
}

interface Context {
   feature: Scenario
   scenario: Scenario
   examples: readonly any[]
   data?: any
}

const rootScenario: Scenario = new Scenario(
   Type.ROOT,
   "root",
   new Set(),
   void 0 as any,
)

rootScenario.addStep = function () {
   throw new Error(
      "Steps can only be added inside a scenario, background or examples context",
   )
}

let context: Context = {
   scenario: rootScenario,
   feature: rootScenario,
   examples: Object.freeze([]),
}

function setContext(nextContext: Context) {
   const previousContext = context
   context = nextContext
   return previousContext
}

function runSteps(
   combinedSteps: any[],
   feature: Scenario,
   scenario: Scenario,
   examples: readonly any[],
   data?: any,
) {
   const previousExample = setContext({
      feature,
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

function getFlag(tags: Set<string>, noDefaultExclude = false): Flag {
   let flag =
      globalThis.LEFTEST_INCLUDED_TAGS.size && !noDefaultExclude
         ? Flag.EXCLUDE
         : Flag.DEFAULT
   if ([...tags].some((tag) => globalThis.LEFTEST_INCLUDED_TAGS.has(tag))) {
      flag = Flag.DEFAULT
   }
   if ([...tags].some((tag) => globalThis.LEFTEST_EXCLUDED_TAGS.has(tag))) {
      flag = Flag.EXCLUDE
   }
   if (flag !== Flag.EXCLUDE && tags.has(only.name)) {
      return Flag.ONLY
   }
   if (flag !== Flag.EXCLUDE && (tags.has(skip.name) || tags.has(todo.name))) {
      return Flag.SKIP
   }
   return flag
}

function createTagFn(tags: Set<any>) {
   return function tag(tagOrFn: Tag | TagFilter): boolean {
      return typeof tagOrFn === "function"
         ? tagOrFn(tag)
         : tags.has(tagOrFn.name)
   }
}

/**
 * Creates a filter that returns true when both tags or tag expressions are matched
 * @param a
 * @param b
 */
export function and(a: any, b: any) {
   assertNoTags(and.name)
   return (tag: any) => tag(a) && tag(b)
}

/**
 * Creates a filter that returns true when either tag or tag expression are matched
 * @param a
 * @param b
 */
export function or(a: Tag | TagFilter, b: Tag | TagFilter) {
   assertNoTags(or.name)
   return (filter: TagFilter) => filter(a) || filter(b)
}

/**
 * Creates a filter that returns true when the given tag is matched.
 * @param tag
 */
export function eq(tag: Tag): (filter: TagFilter) => boolean {
   assertNoTags(eq.name)
   return (filter: TagFilter) => filter(tag)
}

/**
 * Creates a filter that returns true when the given tag or tag expression is not matched.
 * @param tag
 */
export function not(tag: Tag | TagFilter) {
   assertNoTags(not.name)
   return (filter: TagFilter) => !filter(tag)
}

function runHook(hooks: any, tags: Set<string>, scenario: Scenario) {
   for (const [mask, fn = mask] of hooks) {
      if (mask !== fn) {
         const tag = createTagFn(tags)
         if (mask(tag)) {
            fn(scenario)
         }
      } else {
         fn(scenario)
      }
   }
}

function addHooks(
   adapter: TestSuiteAdapter,
   scenario: Scenario,
   tags: Set<any>,
) {
   adapter.beforeSuite(() => {
      runHook(hooks.beforeScenario, tags, scenario)
   })

   adapter.afterSuite(() => {
      runHook(hooks.afterScenario, tags, scenario)
   })

   adapter.beforeTest(() => {
      runHook(hooks.beforeStep, tags, scenario)
   })

   adapter.afterTest(() => {
      runHook(hooks.afterStep, tags, scenario)
   })
}

export function scenario(name: string, fn: () => void) {
   assertContextType(Type.FEATURE, Type.SCENARIO)
   const adapter = getAdapter()
   const tags = flushTags()
   const backgroundSteps = context.scenario.steps
   const scenario = new Scenario(Type.SCENARIO, name, tags, context.feature)
   const feature = context.feature
   const previous = setContext({
      feature,
      scenario,
      examples: [],
   })
   try {
      fn()
      const flag = getFlag(
         tags,
         getFlag(scenario.getEffectiveTags()) !== Flag.EXCLUDE
      )
      if (flag === Flag.EXCLUDE) return

      feature.addScenario(scenario, () => {
         adapter.suite(
            name,
            function () {
               const combinedSteps = [...backgroundSteps, ...scenario.steps]
               if (!scenario.examples.size) {
                  addHooks(adapter, scenario, new Set([...feature.tags, ...scenario.tags]))
                  runSteps(combinedSteps, feature, scenario, context.examples)
               } else {
                  const total = Array.from(scenario.examples.keys()).flat()
                     .length
                  let count = 0
                  for (const [examples, exampleTags] of scenario.examples) {
                     for (const data of examples) {
                        count++
                        const exampleScenario = new Scenario(
                           Type.EXAMPLE,
                           `Example ${count} of ${total}`,
                           exampleTags,
                           scenario.feature,
                           scenario
                        )
                        adapter.suite(
                           exampleScenario.name,
                           () => {
                              addHooks(adapter, exampleScenario, new Set([feature.tags, scenario.tags, ...scenario.examples.values()].flatMap(tags => Array.from(tags))))
                              runSteps(
                                 combinedSteps,
                                 feature,
                                 exampleScenario,
                                 [],
                                 data,
                              )
                           },
                           Flag.DEFAULT,
                        )
                     }
                  }
               }
            },
            flag,
         )
      })
   } finally {
      setContext(previous)
   }
}

declare module globalThis {
   let LEFTEST_ADAPTER: TestSuiteAdapter | undefined
   let LEFTEST_INCLUDED_TAGS: Set<string>
   let LEFTEST_EXCLUDED_TAGS: Set<string>
}

function getAdapter() {
   if (!globalThis.LEFTEST_ADAPTER) {
      throw new Error(
         'No adapter found. Did you forget to call "setAdapter()"?',
      )
   }
   return globalThis.LEFTEST_ADAPTER
}

export function feature(name: string, fn: () => void) {
   assertContextType(Type.ROOT, Type.FEATURE)
   const adapter = getAdapter()
   const tags = flushTags()
   const feature = new Scenario(Type.FEATURE, name, tags, rootScenario)
   feature.addStep = rootScenario.addStep
   const previous = setContext({
      scenario: feature,
      feature,
      examples: [],
   })
   try {
      fn()
      const flag = getFlag(
         tags,
         [...feature.scenarios.keys()].some(
            (scenario) => getFlag(scenario.getEffectiveTags()) !== Flag.EXCLUDE,
         )
      )
      if (flag === Flag.EXCLUDE) return
      adapter.suite(
         name,
         () => {
            for (const factory of feature.scenarios.values()) {
               factory()
            }
         },
         flag,
      )
   } finally {
      setContext(previous)
   }
}

export function background(fn: () => void) {
   assertContextType(Type.FEATURE, background.name)
   assertNoTags(background.name)
   context.scenario.addStep = Scenario.prototype.addStep
   try {
      fn()
   } finally {
      context.scenario.addStep = rootScenario.addStep
   }
}

function examples(data: any[]) {
   assertContextType(Type.SCENARIO, Type.EXAMPLE)
   const tags = flushTags()
   const flag = getFlag(tags, tags.size === 0)
   if (flag === Flag.EXCLUDE) return
   context.scenario.addExamples(data, tags)
}

const names = new Map<string, number>()

function createStep(steps: Steps) {
   return function step(name: string, step: string, ...args: readonly any[]) {
      assertNoTags(name.toLowerCase())
      const adapter = getAdapter()
      context.scenario.addStep(() => {
         const parentName = context.scenario.getFullName()
         let parsedArgs = args as any[]
         if (!parsedArgs.length) {
            parsedArgs = parseArguments(step)
         }
         if (!parsedArgs.length) {
            parsedArgs = steps.getArgsFromObject(step, context.data)
         }
         let testName = steps.getTestName(step, parsedArgs)
         const count = names.get(parentName + testName) ?? 1
         const impl = steps.getImplementation(step)
         const { scenario } = context

         names.set(parentName + testName, count + 1)

         if (count > 1) {
            testName = `${testName} [${count}]`
         }

         if (testName) {
            adapter.test(`${name} ${testName}`, function (this: any) {
               if (scenario.failed) {
                  if (adapter.skip) {
                     adapter.skip(this)
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
            })
         }
      })
   }
}

function splitVars(name: string) {
   return (name.split(/(<[^\s]*?>)/g) ?? []).map((s) =>
      s.startsWith("<") ? { var: stripDelimiters(s) } : s,
   )
}

class EmptyVar {
   constructor(public name: string) {}
}

class Steps {
   normalNames: Record<
      string,
      { name: string; vars: any[]; impl: (...args: any[]) => void }
   >

   getTestName(name: string, args: readonly any[]) {
      const copy = args.slice(0)
      const step = this.getStep(name)
      const varLen = step.vars.filter((s) => typeof s !== "string").length
      if (copy.length < varLen) {
         throw new Error(`Expected at least ${varLen} argument${
            varLen > 1 ? "s" : ""
         }, received ${copy.length}
   ${name}
`)
      }
      return step.vars
         .map((s) => {
            if (typeof s === "string") {
               return s
            } else {
               const val = copy.shift()
               if (this.options.stringifyPlaceholderArguments) {
                  return JSON.stringify(val)
               } else {
                  return typeof val === "string"
                     ? val
                     : Array.isArray(val)
                     ? val.join()
                     : val
               }
            }
         })
         .join("")
   }

   getImplementation(step: string) {
      return this.getStep(step).impl
   }

   getArgsFromObject(step: string, data: Record<string, unknown>) {
      const args = splitVars(step)
         .filter((s) => typeof s !== "string")
         .map((s: any) => {
            if (s.var in data) {
               return data[s.var]
            }
            return new EmptyVar(s.var)
         })

      const missing = args
         .filter((s): s is EmptyVar => s instanceof EmptyVar)
         .map((s) => `"${s.name}"`)
      if (missing.length) {
         throw new Error(`No value given for ${new Intl.ListFormat("en").format(
            missing,
         )}
   ${step}
`)
      }
      return args
   }

   hasArgs(step: string) {
      return this.getStep(step).vars.length > 1
   }

   getStep(name: string) {
      const step = this.normalNames[normalize(name)]
      if (!step) {
         throw new Error(`No step matched: 
   ${name}`)
      }
      return step
   }

   constructor(steps: any, private options: TestSuiteOptions) {
      this.normalNames = {}

      Object.entries(steps)
         .map(([name]) => [normalize(name), name])
         .forEach(([normalized, name], index, arr) => {
            const matches = arr
               .filter(([match], matchIndex) => {
                  return normalized === match && matchIndex !== index
               })
               .map(([_, name]) => name)
            if (!matches.length) return
            throw new Error(`Ambiguous step detected:
   ${name}
Matches:
   ${matches.join("\n   ")}
`)
         })

      for (const [name, impl] of Object.entries(steps)) {
         this.normalNames[normalize(name)] = {
            name,
            vars: splitVars(name),
            impl: impl as (...args: any[]) => void,
         }
      }
   }
}

const tags = [] as string[]

function flushTags(): Set<string> {
   const flushed = new Set(tags)
   tags.length = 0
   return flushed
}

function assertNoTags(method: string) {
   const tags = [...flushTags()].map((s) => `"${s}"`)
   if (tags.length > 0) {
      throw new Error(
         `Tag${tags.length > 1 ? "s" : ""} ${new Intl.ListFormat("en").format(
            tags,
         )} ${tags.length > 1 ? "are" : "is"} not allowed on "${method}"`,
      )
   }
}

function assertContextType(expected: Type, name: string) {
   if (context.scenario.type !== expected) {
      throw new Error(`"${name}" can only be used in a ${expected} context`)
   }
}

const tagCache = new Map()

type TagProxy = { [key: string]: Tag }

/**
 * Returns a proxy that generates a {@link Tag} for each object key
 * @return TagProxy
 */
// IntelliJ doesn't resolve references for index signatures, so leave this return type as `any` for now.
export function getTags(): any {
   assertContextType(Type.ROOT, getTags.name)
   assertNoTags(getTags.name)
   return new Proxy(
      {},
      {
         get(_, p: string) {
            if (tagCache.has(p)) {
               return tagCache.get(p)
            }
            const tag = {
               [Symbol.toPrimitive](hint: string) {
                  tags.push(p)
                  if (hint === "string" || hint === "default") {
                     return p
                  }
                  return 0
               },
               name: p,
            }
            tagCache.set(p, tag)
            return tag
         },
      },
   )
}

globalThis.LEFTEST_ADAPTER ??= undefined
globalThis.LEFTEST_INCLUDED_TAGS ??= new Set()
globalThis.LEFTEST_EXCLUDED_TAGS ??= new Set()

export function setAdapter(value: TestSuiteAdapter) {
   assertNoTags(setAdapter.name)
   globalThis.LEFTEST_ADAPTER = value
}

export function setTags(tags: string | string[]) {
   assertNoTags(setTags.name)
   globalThis.LEFTEST_INCLUDED_TAGS.clear()
   globalThis.LEFTEST_EXCLUDED_TAGS.clear()
   const taglist = Array.isArray(tags)
      ? tags
      : tags
           .trim()
           .split(/[,\s]+/)
           .filter(Boolean)
   for (const tag of taglist) {
      if (tag.startsWith("^")) {
         globalThis.LEFTEST_EXCLUDED_TAGS.add(tag.slice(1))
      } else {
         globalThis.LEFTEST_INCLUDED_TAGS.add(tag)
      }
   }
}

const hooks = {
   beforeScenario: [] as any[],
   beforeStep: [] as any[],
   afterScenario: [] as any[],
   afterStep: [] as any[],
}

/**
 * Run code before a scenario is executed only if the scenario has tags matching the filter.
 * @param filter The tag expression to be matched against
 * @param fn
 */
export function beforeScenario(
   filter: ((filter: TagFilter) => boolean),
   fn: (scenario: ReadonlyScenario) => void,
): void
/**
 * Run code before every scenario is executed.
 * @param fn
 */
export function beforeScenario(fn: (scenario: ReadonlyScenario) => void): void
export function beforeScenario(
   filter: ((filter: TagFilter) => boolean) | ((scenario: ReadonlyScenario) => void),
   fn?: (scenario: ReadonlyScenario) => void,
) {
   assertContextType(Type.ROOT, beforeScenario.name)
   assertNoTags(beforeScenario.name)
   hooks.beforeScenario.push([filter, fn])
}

/**
 * Run code before a step is executed only if the scenario has tags matching the filter.
 * @param filter The tag expression to be matched against
 * @param fn
 */
export function beforeStep(
   filter: ((filter: TagFilter) => boolean),
   fn: (scenario: ReadonlyScenario) => void,
): void
/**
 * Run code before every step is executed.
 * @param fn
 */
export function beforeStep(fn: (scenario: ReadonlyScenario) => void): void
export function beforeStep(
   filter: ((filter: TagFilter) => boolean) | ((scenario: ReadonlyScenario) => void),
   fn?: (scenario: ReadonlyScenario) => void,
) {
   assertContextType(Type.ROOT, beforeStep.name)
   assertNoTags(beforeStep.name)
   hooks.beforeStep.push([filter, fn])
}

/**
 * Run code after a scenario is executed only if the scenario has tags matching the filter.
 * @param filter The tag expression to be matched against
 * @param fn
 */
export function afterScenario(
   filter: ((filter: TagFilter) => boolean),
   fn: (scenario: ReadonlyScenario) => void,
): void
/**
 * Run code after every scenario is executed.
 * @param fn
 */
export function afterScenario(fn: (scenario: ReadonlyScenario) => void): void
export function afterScenario(
   filter: ((filter: TagFilter) => boolean) | ((scenario: ReadonlyScenario) => void),
   fn?: (scenario: ReadonlyScenario) => void,
) {
   assertContextType(Type.ROOT, afterScenario.name)
   assertNoTags(afterScenario.name)
   hooks.afterScenario.push([filter, fn])
}

/**
 * Run code after a step is executed only if the scenario has tags matching the filter.
 * @param filter The tag expression to be matched against
 * @param fn
 */
export function afterStep(
   filter: ((filter: TagFilter) => boolean),
   fn: (scenario: ReadonlyScenario) => void,
): void
/**
 * Run code after every step is executed.
 * @param fn
 */
export function afterStep(fn: (scenario: ReadonlyScenario) => void): void
export function afterStep(
   filter: ((filter: TagFilter) => boolean) | ((scenario: ReadonlyScenario) => void),
   fn?: (scenario: ReadonlyScenario) => void,
) {
   assertContextType(Type.ROOT, afterStep.name)
   assertNoTags(afterStep.name)
   hooks.afterStep.push([filter, fn])
}

export const {
   // @deprecated Remove before commit. For debugging use only.
   only,
   // @deprecated Remove before commit. For debugging use only. For test stubs use the "todo" tag instead.
   skip,
   todo
} = getTags()

/**
 * Creates an untyped  {@link TestSuite} for writing test stubs. Mark test stubs as {@link todo} so exclude them from test runs until they are implemented.
 */
export function createTestSuite(): TestSuite<any>
/**
 * Creates a typed {@link TestSuite} from a module import.
 * @param options
 */
export function createTestSuite<T extends object>(
   options: { default: T } & TestSuiteOptions,
): TestSuite<T>
/**
 * Creates a typed {@link TestSuite} from the given steps.
 * @param steps
 * @param options
 */
export function createTestSuite<T extends object>(
   steps: T,
   options?: TestSuiteOptions,
): TestSuite<T>
export function createTestSuite<T extends object>(
   stepsOrOptions?: {
      default?: T
      steps?: T
   } & TestSuiteOptions,
   options: TestSuiteOptions = stepsOrOptions ?? {},
): TestSuite<any> {
   assertContextType(Type.ROOT, createTestSuite.name)
   assertNoTags(createTestSuite.name)
   options.stringifyPlaceholderArguments ??= true
   const steps = new Steps(
      (arguments.length > 1
         ? stepsOrOptions
         : stepsOrOptions?.default ?? stepsOrOptions) ?? {},
      options,
   )
   const step = createStep(steps)

   return {
      given: step.bind(null, "Given"),
      when: step.bind(null, "When"),
      then: step.bind(null, "Then"),
      and: step.bind(null, "And"),
      but: step.bind(null, "But"),
      examples,
   } as any
}

/**
 * Returns true if the tag is included in the current test run.
 * @param tag
 */
export function isIncluded(tag: Tag) {
   return globalThis.LEFTEST_INCLUDED_TAGS.has(tag.name)
}

/**
 Returns true if the tag is excluded in the current test run.
 @param tag
 */
export function isExcluded(tag: Tag) {
   return globalThis.LEFTEST_EXCLUDED_TAGS.has(tag.name)
}
