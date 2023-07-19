import {
   Flag, ReadonlyScenario,
   setAdapter,
   setTags, TagFilter,
   TestSuiteAdapter, TestSuiteAdapterMetadata,
   beforeScenario as _beforeScenario,
   afterScenario as _afterScenario,
   beforeStep as _beforeStep,
   afterStep as _afterStep,
} from "@antischematic/leftest"

import { test } from '@playwright/test';
import {
   PlaywrightTestArgs,
   PlaywrightTestOptions,
   PlaywrightWorkerArgs, PlaywrightWorkerOptions,
} from "@playwright/test/types/test"

import process from  "node:process"

export class PlaywrightTestSuiteAdapter implements TestSuiteAdapter {
   isAsync = true

   suite(name: string, impl: () => void, flag: Flag): void {
      switch (flag) {
         case Flag.SKIP:
            test.describe.skip(name, impl)
            break
         case Flag.ONLY:
            test.describe.only(name, impl)
            break
         case Flag.DEFAULT:
            test.describe(name, impl)
      }
   }

   test(name: string, impl: (context: any) => void, metadata: TestSuiteAdapterMetadata): void {
      this.decorateFunction(impl, name, [...metadata.steps, ...metadata.beforeScenario, ...metadata.afterScenario, ...metadata.beforeStep, ...metadata.afterStep])
      switch (metadata.flag) {
         case Flag.SKIP:
            test.skip(name, impl)
            break
         case Flag.ONLY:
            test.only(name, impl)
            break
         case Flag.DEFAULT:
            test(name, impl)
      }
   }

   afterScenario(impl: (context?: any) => void, metadata: TestSuiteAdapterMetadata): void {
      return impl()
   }

   afterStep(impl: (context?: any) => void, metadata: TestSuiteAdapterMetadata): void {
      return impl()
   }

   beforeScenario(impl: (context?: any) => void, metadata: TestSuiteAdapterMetadata): void {
      return impl()
   }

   beforeStep(impl: (context?: any) => void, metadata: TestSuiteAdapterMetadata): void {
      return impl()
   }

   step(name: string, description: string, impl: (context?: any) => void) {
      return test.step(description, impl)
   }

   private decorateFunction(fn: Function, name: string, steps: readonly Function[]) {
      const fixtures = this.getFixtures(steps)
      const argString = `{ ${fixtures.join(', ')} }`
      fn.toString = () => {
         return `async function test(${argString}) { [scenario: ${name}] }`
      }
   }

   private parseFixtures(step: Function) {
      const body = step.toString().replace(/(\r\n|\n|\r)/gm, "")
      const arg = body.match(/{.*?}/)
      const argString = arg ? arg[0] : ""
      const fakeFunction = new Function(`return function (_arg) {
        let ${argString} = _arg
      }`)()
      const fixtures = [] as string[]
      const proxy = new Proxy({}, {
         get(target: {}, p: string): any {
            fixtures.push(p)
         }
      })
      fakeFunction(proxy)
      return fixtures
   }

   private getFixtures(steps: readonly Function[]) {
      return Array.from(new Set(steps.flatMap((step) => this.parseFixtures(step))))
   }
}

interface PlaywrightSteps {
   [key: string]: (context: PlaywrightTestArgs & PlaywrightTestOptions, ...args: any[]) => void
}

type MappedSteps<T extends PlaywrightSteps> = {
   [key in keyof T]: (...params: Parameters<T[key]> extends [any, ...infer R] ? R : []) => ReturnType<T[key]>
}

function bindHook(register: any, filter: any, fn: any) {
   const hook = (fn || filter) as (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void
   function cb(this: any, scenario: any) {
      return hook(this, scenario)
   }
   cb.toString = () => hook.toString()
   if (fn) {
      register(filter as ((filter: TagFilter) => boolean), cb)
   } else {
      register(cb)
   }
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
export function beforeScenario<T extends ReadonlyScenario>(fn: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: T) => void): void
export function beforeScenario(
   filter: ((filter: TagFilter) => boolean) | ((context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void),
   fn?: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void,
) {
   bindHook(_beforeScenario, filter, fn)
}

/**
 * Run code before a step is executed only if the scenario has tags matching the filter.
 * @param filter The tag expression to be matched against
 * @param fn
 */
export function beforeStep<T extends ReadonlyScenario>(
   filter: ((filter: TagFilter) => boolean),
   fn: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: T) => void,
): void
/**
 * Run code before every step is executed.
 * @param fn
 */
export function beforeStep<T extends ReadonlyScenario>(fn: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: T) => void): void
export function beforeStep(
   filter: ((filter: TagFilter) => boolean) | ((context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void),
   fn?: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void,
) {
   bindHook(_beforeStep, filter, fn)
}

/**
 * Run code after a scenario is executed only if the scenario has tags matching the filter.
 * @param filter The tag expression to be matched against
 * @param fn
 */
export function afterScenario<T extends ReadonlyScenario>(
   filter: ((filter: TagFilter) => boolean),
   fn: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: T) => void,
): void
/**
 * Run code after every scenario is executed.
 * @param fn
 */
export function afterScenario<T extends ReadonlyScenario>(fn: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: T) => void): void
export function afterScenario(
   filter: ((filter: TagFilter) => boolean) | ((context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void),
   fn?: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void,
) {
   bindHook(_afterScenario, filter, fn)
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
export function afterStep<T extends ReadonlyScenario>(fn: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void): void
export function afterStep(
   filter: ((filter: TagFilter) => boolean) | ((context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void),
   fn?: (context: PlaywrightTestArgs & PlaywrightTestOptions, scenario: ReadonlyScenario) => void,
) {
   bindHook(_afterStep, filter, fn)
}

export const createSteps = <T extends PlaywrightSteps>(steps: T): MappedSteps<T> => {
   const mapped = {} as any
   for (const key in steps) {
      mapped[key] = function (this: any, ...args: any[]) {
         return steps[key](this, ...args)
      }
      mapped[key].toString = () => steps[key].toString()
   }
   return mapped
}

setAdapter(new PlaywrightTestSuiteAdapter())
setTags(process.env["LEFTEST_TAGS"] ?? "")
