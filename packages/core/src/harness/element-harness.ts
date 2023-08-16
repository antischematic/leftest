import {
   BaseHarnessFilters,
   ComponentHarness, DomInvoker, HarnessPredicate,
   LocatorFactory,
   TestElement, TestElementInput,
} from "@antischematic/leftest"


export interface ElementHarnessOptions extends BaseHarnessFilters {
   text?: string | RegExp
}

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

export function element(selector: string, options?: ElementHarnessOptions): HarnessPredicate<ElementHarness>
export function element(selector: string, options: ElementHarnessOptions = {}): unknown {
   class ElementHarness extends TestElementProxy {
      static hostSelector = selector
   }
   return new HarnessPredicate(ElementHarness, options)
}
