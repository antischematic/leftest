import {
   AsyncPredicate, BaseHarnessFilters,
   ComponentHarness, ComponentHarnessConstructor,
   HarnessPredicate,
   LocatorFactory,
} from "./component-harness"
import { TestElement } from "./test-element"

export const methodNames = new Set<any>([
   "blur",
   "clear",
   "click",
   "rightClick",
   "focus",
   "getCssValue",
   "hover",
   "mouseAway",
   "sendKeys",
   "text",
   "setContenteditableValue",
   "getAttribute",
   "hasClass",
   "getDimensions",
   "getProperty",
   "matchesSelector",
   "isFocused",
   "setInputValue",
   "selectOptions",
   "dispatchEvent",
   "getHandle"
])

export interface ElementHarness extends ComponentHarness, TestElement {}

class TestElementProxy extends ComponentHarness {
   constructor(locatorFactory: LocatorFactory) {
      super(locatorFactory)
      return new Proxy(this, {
         get(target: TestElementProxy, p: string | symbol): any {
            if (Reflect.has(target, p)) {
               return Reflect.get(target, p)
            }
            if (methodNames.has(p)) {
               return async function (...args: any[]) {
                  const host: any = await target.host()
                  return host[p](...args)
               }
            }
         }
      })
   }
}

function getElementHarness(selector: string) {
   return class ElementHarness extends TestElementProxy {
      static hostSelector = selector
   }
}

export function query<T extends ComponentHarness>(harness: ComponentHarnessConstructor<T>, ...predicates: AsyncPredicate<T>[]): HarnessPredicate<T>
export function query<T extends ComponentHarness>(harness: ComponentHarnessConstructor<T>, within: string, ...predicates: AsyncPredicate<T>[]): HarnessPredicate<T>
export function query(selector: string, ...predicates: AsyncPredicate<ComponentHarness>[]): HarnessPredicate<ElementHarness>
export function query(selector: string, within: string, ...predicates: AsyncPredicate<ComponentHarness>[]): HarnessPredicate<ElementHarness>
export function query(selectorOrHarness: string | BaseHarnessFilters | ComponentHarnessConstructor<ComponentHarness>, ancestorOrPredicate: string | AsyncPredicate<any>, ...predicates: AsyncPredicate<ComponentHarness>[]): unknown {
   const isHarness = typeof selectorOrHarness === "function"
   const options = typeof ancestorOrPredicate === "string" ? { ancestor: ancestorOrPredicate } : {}
   const selector = typeof selectorOrHarness === "string" ? selectorOrHarness : undefined
   const query = new HarnessPredicate(isHarness ? selectorOrHarness : getElementHarness(selector ?? '*'), options)
   if (typeof ancestorOrPredicate === "function") {
      predicates = [ancestorOrPredicate, ...predicates]
   }
   for (const predicate of predicates) {
      query.add(`matches query predicate "${predicate.name}"`, predicate)
   }
   return query
}
