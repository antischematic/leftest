import { clearTestContext } from "./context"
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

class Scenario {
   data: { [key: string]: unknown } = {}
   failed = false
   steps: any[] = []
   examples: Map<string, { data: any[], tags: Set<string>, flag: Flag }> = new Map()
   scenarios: Map<string, { scenario: Scenario, factory: () => void }> = new Map()

   get path(): string[] {
      return [...(this.parent?.path ?? []), this.name]
   }

   addStep(factory: (context: any) => void): void {
      this.steps.push(factory)
   }

   addExamples(name: string, data: any[], tags: Set<any>, flag: Flag) {
      if (this.examples.has('') || this.examples.size && name === '') {
         throw new Error(`Example description cannot be blank when a scenario has multiple "examples()"`)
      }
      if (this.examples.has(name)) {
         throw new Error(`Multiple examples detected: "${name}". Each "examples()" in a scenario must have a unique description`)
      }
      this.examples.set(name, { data, tags, flag })
   }

   addScenario(scenario: Scenario, factory: () => void, flag: Flag) {
      if (this.examples.has(scenario.name)) {
         throw new Error(`Multiple scenarios detected: "${scenario.name}". Each "scenario()" in a feature must have a unique description`)
      }
      this.scenarios.set(scenario.name, { scenario, factory })
   }

   markAsFailed() {
      this.failed = true
   }

   getFullName() {
      const parentName: string = this.parent?.getFullName() ?? ""
      return parentName + this.name
   }

   hasOwnTag(tag: Tag) {
      return this.tags.has(tag.name)
   }

   hasTag(tag: Tag) {
      return this.getEffectiveTags().has(tag.name)
   }

   getEffectiveTags() {
      const tags = [this.feature?.tags ?? [], this.parent?.tags ?? [], this.tags, [...this.examples.values()].flatMap(e => Array.from(e.tags))].flatMap(tags => Array.from(tags))
      return new Set(tags)
   }

   constructor(
      readonly type: Type,
      readonly name: string,
      readonly tags: Set<string>,
      readonly feature: Scenario,
      readonly parent?: Scenario,
   ) {
      scenarios.add(this)
   }
}

const scenarios = new Set<ReadonlyScenario>()

export function getAllScenarios() {
   return Array.from(scenarios)
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

function runScenario(
   adapter: TestSuiteAdapter,
   combinedSteps: any[],
   feature: Scenario,
   scenario: Scenario,
   examples: readonly any[],
   data?: any,
   context?: any
) {
   const metadata = { steps: combinedSteps.map((step) => step(GET_IMPL)), ...getAllEffectiveHooks(scenario.getEffectiveTags()) }
   const previousExample = setContext({
      feature,
      scenario,
      examples,
      data,
   })
   try {
      runHooks(metadata.beforeScenario, scenario, context, (impl) => adapter.beforeScenario(impl, metadata))
      try {
         for (const step of combinedSteps) {
            runHooks(metadata.beforeStep, scenario, context, (impl) => adapter.beforeStep(impl, metadata))
            step(context)
            runHooks(metadata.afterStep, scenario, context, (impl) => adapter.afterStep(impl, metadata))
         }
      } finally {
         runHooks(metadata.afterScenario, scenario, context, (impl) => adapter.afterScenario(impl, metadata))
      }
      clearTestContext()
   } finally {
      setContext(previousExample)
   }
}

async function runScenarioAsync(
   adapter: TestSuiteAdapter,
   combinedSteps: any[],
   feature: Scenario,
   scenario: Scenario,
   examples: readonly any[],
   data?: any,
   context?: any
) {
   const previousExample = setContext({
      feature,
      scenario,
      examples,
      data,
   })
   const metadata = { steps: combinedSteps.map((step) => step(GET_IMPL)), ...getAllEffectiveHooks(scenario.getEffectiveTags()) }
   try {
      await runHooksAsync(metadata.beforeScenario, scenario, context,(impl) => adapter.beforeScenario(impl, metadata))
      try {
         for (const step of combinedSteps) {
            await runHooksAsync(metadata.beforeStep, scenario, context,(impl) => adapter.beforeStep(impl, metadata))
            await step(context)
            await runHooksAsync(metadata.afterStep, scenario, context,(impl) => adapter.afterStep(impl, metadata))
         }
      } finally {
         await runHooksAsync(metadata.afterScenario, scenario, context, (impl) => adapter.afterScenario(impl, metadata))
      }
      clearTestContext()
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

function getEffectiveHooks(hooks: any, tags: Set<string>) {
   let effectiveHooks = [] as ((scenario: Scenario) => void)[]
   for (const [mask, fn = mask] of hooks) {
      if (mask !== fn) {
         const tag = createTagFn(tags)
         if (mask(tag)) {
            effectiveHooks.push(fn)
         }
      } else {
         effectiveHooks.push(fn)
      }
   }
   return effectiveHooks
}

function runHooks(hooks: any[], scenario: Scenario, context: any, cb: (impl: () => void) => void) {
   if (!hooks.length) return
   cb(() => {
      for (const hook of hooks) {
         hook.call(context, scenario)
      }
   })
}

async function runHooksAsync(hooks: any[], scenario: Scenario, context: any, cb: (impl: () => void) => void) {
   if (!hooks.length) return
   return cb(async () => {
      for (const hook of hooks) {
         await hook.call(context, scenario)
      }
   })
}

function getAllEffectiveHooks(tags: Set<string>) {
   const beforeScenario = getEffectiveHooks(hooks.beforeScenario, tags)
   const afterScenario = getEffectiveHooks(hooks.afterScenario, tags)
   const beforeStep = getEffectiveHooks(hooks.beforeStep, tags)
   const afterStep = getEffectiveHooks(hooks.afterStep, tags)
   return { beforeScenario, afterScenario, beforeStep, afterStep }
}

function runExamples(examples: any[], exampleTags: Set<any>, scenario: Scenario, adapter: TestSuiteAdapter, steps: any[], flag: Flag) {
   let count = 0
   const total = examples.length
   const feature = scenario.feature
   for (const data of examples) {
      count++
      const exampleScenario = new Scenario(
         Type.EXAMPLE,
         `Example ${count} of ${total}`,
         exampleTags,
         scenario.feature,
         scenario
      )
      console.log('data', data)
      const metadata = { flag, steps: steps.map((step) => step(GET_IMPL)), ...getAllEffectiveHooks(exampleScenario.getEffectiveTags()) }
      adapter.test(
         exampleScenario.name,
         (ctx) => {
            return (adapter.isAsync ? runScenarioAsync : runScenario)(
               adapter,
               steps,
               feature,
               exampleScenario,
               [],
               data,
               ctx
            )
         },
         metadata,
      )
   }
}

export function scenario(name: string, fn: () => void) {
   assertContextType(Type.FEATURE, Type.SCENARIO)
   const adapter = getAdapter()
   const tags = flushTags()
   const backgroundSteps = context.scenario.steps
   const scenario = new Scenario(Type.SCENARIO, name, tags, context.feature, context.feature)
   const feature = context.feature
   const previous = setContext({
      feature,
      scenario,
      examples: [],
   })
   try {
      fn()
      const isExcluded = getFlag(scenario.feature.tags) === Flag.EXCLUDE && Array.from(scenario.examples.values()).map(e => getFlag(e.tags)).every(flag => flag === Flag.EXCLUDE)

      const flag = getFlag(
         tags,
         !isExcluded
      )

      const combinedSteps = [...backgroundSteps, ...scenario.steps]

      feature.addScenario(scenario, () => {
         if (scenario.examples.size) {
            adapter.suite(name, () => {
               for (const [exampleName, { data: examples, tags: exampleTags, flag }] of scenario.examples) {
                  if (exampleName) {
                     adapter.suite(exampleName, () => {
                        runExamples(examples, exampleTags, scenario, adapter, combinedSteps, flag)
                     }, flag)
                  } else {
                     runExamples(examples, exampleTags, scenario, adapter, combinedSteps, flag)
                  }
               }
            }, flag)
         } else {
            const metadata = { flag, steps: combinedSteps.map((step) => step(GET_IMPL)), ...getAllEffectiveHooks(scenario.getEffectiveTags()) }
            adapter.test(
               name,
               function (ctx) {
                  return (adapter.isAsync ? runScenarioAsync : runScenario)(adapter, combinedSteps, feature, scenario, context.examples, undefined, ctx)
               },
               metadata,
            )
         }
      }, flag)
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
         [...feature.scenarios.values()].some(
            ({ scenario }) => getFlag(scenario.getEffectiveTags()) !== Flag.EXCLUDE,
         )
      )
      adapter.suite(
         name,
         () => {
            for (const { factory } of feature.scenarios.values()) {
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
function examples(name: string, data: any[]): void
function examples(data: any[]): void
function examples(...args: any[]): void {
   const name = args.length > 1 ? args[0] : ''
   const data = args[args.length - 1]
   assertContextType(Type.SCENARIO, Type.EXAMPLE)
   const tags = flushTags()
   const flag = getFlag(tags, tags.size === 0)
   context.scenario.addExamples(name, data, tags, flag)
}

const GET_IMPL = Symbol()

function createStep(steps: Steps) {
   return function step(name: string, step: string, ...args: readonly any[]) {
      assertNoTags(name.toLowerCase())
      const adapter = getAdapter()
      context.scenario.addStep((ctx: any) => {
         const impl = steps.getImplementation(step)
         if (ctx === GET_IMPL) {
            return impl as any
         }
         let parsedArgs = args as any[]
         if (!parsedArgs.length) {
            parsedArgs = parseArguments(step)
         }
         if (!parsedArgs.length) {
            parsedArgs = steps.getArgsFromObject(step, context.data)
         }
         let testName = steps.getTestName(step, parsedArgs)
         const { scenario } = context
         const metadata = { steps: scenario.steps.map((step) => step(GET_IMPL)), ...getAllEffectiveHooks(scenario.getEffectiveTags()) }

         if (testName) {
            let step: (context?: any) => void
            if (adapter.isAsync) {
               step = async function (stepCtx: any) {
                  ctx = stepCtx || ctx
                  if (scenario.failed) {
                     throw new Error("Previous step failed")
                  }
                  try {
                     await impl.apply(ctx, parsedArgs)
                  } catch (e) {
                     scenario.markAsFailed()
                     throw e
                  }
               }
            } else {
               step = function (stepCtx: any) {
                  ctx = stepCtx || ctx
                  if (scenario.failed) {
                     throw new Error("Previous step failed")
                  }
                  try {
                     impl.apply(ctx, parsedArgs)
                  } catch (e) {
                     scenario.markAsFailed()
                     throw e
                  }
               }
            }
            return adapter.step(name, testName, step, metadata)
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
const usedTags = new Set()

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
                  usedTags.add(p)
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

export function isTagUsed(tag: Tag) {
   return usedTags.has(tag.name)
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
export function beforeScenario<T extends ReadonlyScenario>(
   filter: ((filter: TagFilter) => boolean),
   fn: (scenario: T) => void,
): void
/**
 * Run code before every scenario is executed.
 * @param fn
 */
export function beforeScenario<T extends ReadonlyScenario>(fn: (scenario: T) => void): void
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
export function beforeStep<T extends ReadonlyScenario>(
   filter: ((filter: TagFilter) => boolean),
   fn: (scenario: T) => void,
): void
/**
 * Run code before every step is executed.
 * @param fn
 */
export function beforeStep<T extends ReadonlyScenario>(fn: (scenario: T) => void): void
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
export function afterScenario<T extends ReadonlyScenario>(
   filter: ((filter: TagFilter) => boolean),
   fn: (scenario: T) => void,
): void
/**
 * Run code after every scenario is executed.
 * @param fn
 */
export function afterScenario<T extends ReadonlyScenario>(fn: (scenario: T) => void): void
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
export function afterStep<T extends ReadonlyScenario>(
   filter: ((filter: TagFilter) => boolean),
   fn: (scenario: T) => void,
): void
/**
 * Run code after every step is executed.
 * @param fn
 */
export function afterStep<T extends ReadonlyScenario>(fn: (scenario: ReadonlyScenario) => void): void
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
