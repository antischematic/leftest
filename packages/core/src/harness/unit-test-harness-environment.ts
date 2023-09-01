import { ComponentHarness, ExtraOptions, StableResult } from "./component-harness"
import { HarnessEnvironment } from "./harness-environment"
import { HarnessQuery } from "./harness-predicate"
import { TestElement } from "./test-element"
import { UnitTestElement } from "./unit-test-element"


export class UnitTestHarnessEnvironment extends HarnessEnvironment<Element> {
   static getHarness<T extends ComponentHarness>(harnessType: HarnessQuery<T>, options?: ExtraOptions): Promise<T> {
      return new UnitTestHarnessEnvironment(document.body).getHarness(harnessType, options)
   }

   static getHarnessOrNull<T extends ComponentHarness>(harnessType: HarnessQuery<T>, options: ExtraOptions<null>): Promise<null>
   static getHarnessOrNull<T extends ComponentHarness>(harnessType: HarnessQuery<T>, options: ExtraOptions<true>): Promise<T>
   static getHarnessOrNull<T extends ComponentHarness>(harnessType: HarnessQuery<T>, options?: ExtraOptions<boolean | null>): Promise<T | null>
   static getHarnessOrNull<T extends ComponentHarness>(harnessType: HarnessQuery<T>, options?: ExtraOptions<boolean | null>): Promise<T | null> {
      return new UnitTestHarnessEnvironment(document.body).getHarnessOrNull(harnessType, options)
   }

   static getAllHarnesses<T extends ComponentHarness>(harnessType: HarnessQuery<T>, options?: ExtraOptions): Promise<T[]> {
      return new UnitTestHarnessEnvironment(document.body).getAllHarnesses(harnessType, options)
   }

   static getHarnessForContainer<T extends ComponentHarness>(element: Element, harnessType: HarnessQuery<T>, options?: ExtraOptions): Promise<T> {
      return new UnitTestHarnessEnvironment(element).getHarness(harnessType, options)
   }

   static getAllHarnessesForContainer<T extends ComponentHarness>(element: Element, harnessType: HarnessQuery<T>, options?: ExtraOptions): Promise<T[]> {
      return new UnitTestHarnessEnvironment(element).getAllHarnesses(harnessType, options)
   }

   static getRootHarnessLoader() {
      return new UnitTestHarnessEnvironment(document.body).rootHarnessLoader()
   }

   static getNativeElement<T extends Element>(element: TestElement | ComponentHarness): T {
      if (element instanceof UnitTestElement) {
         return element.element as T
      }
      if (element instanceof ComponentHarness) {
         return this.getNativeElement(element.host())
      }
      throw new Error("This TestElement was not created by the UnitTestHarnessEnvironment")
   }

   async forceStabilize(): Promise<void> {
      await new Promise(requestAnimationFrame)
   }

   waitForTasksOutsideAngular(): Promise<void> {
      throw new Error('Method not implemented.');
   }

   protected getDocumentRoot(): Element {
      return document.body;
   }

   protected createTestElement(element: Element): TestElement {
      return new UnitTestElement(element, () => Promise.resolve());
   }

   protected createEnvironment(element: Element): HarnessEnvironment<Element> {
      return new UnitTestHarnessEnvironment(element)
   }

   protected async getAllRawElements(selector: string, options: ExtraOptions = {}): Promise<Element[]> {
      let evaluate = () => Array.from(this.rawRootElement.querySelectorAll(selector))
      if (options.wait !== false) {
         return this.waitForStable(async (next) => {
            const result = evaluate()
            if (options.wait === null && result.length > 0 || options.wait && result.length === 0) {
               next()
            }
            return result
         })
      }
      return evaluate()
   }

   /**
    * Evaluates an expression on each animation frame until it returns a truthy result. A value is considered
    * stable if it doesn't change for two consecutive frames. Values are compared with strict equality for primitives and
    * JSON.stringify for objects.
    *
    * @param expr If skip param is specified, value comparison is disabled and the first non-skipped result is returned
    * @returns The first stable truthy result
    */
   async waitForStable<T>(expr: (skip: () => never) => T): Promise<Awaited<T>>
   async waitForStable<T>(expr: () => T): StableResult<T>
   async waitForStable<T>(expr:  (skip: () => never) => T): Promise<T> {
      let previous: T | undefined
      let comparePrevious = expr.length === 0
      while (true) {
         let result: T | undefined
         try {
            result = await expr(skip)
         } catch (e) {
            if (e !== SKIP) {
               throw e
            }
            await this.forceStabilize()
            continue
         }
         if (!comparePrevious) {
            return result as T
         }
         if (previous !== undefined && (result === previous || JSON.stringify(result) === JSON.stringify(previous))) {
            return previous as StableResult<T>
         }
         previous = result
         await this.forceStabilize()
      }
   }
}

const SKIP = Symbol("SKIP")

function skip(): never {
   throw SKIP
}
