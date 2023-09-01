import {
   HarnessEnvironment,
   StableResult,
   TestElement,
   UnitTestElement,
} from "@antischematic/leftest"

export class CypressHarnessEnvironment extends HarnessEnvironment<Element> {
   /**
    * We need this to keep a reference to the document.
    * This is different to `rawRootElement` which is the root element
    * of the harness's environment.
    * (The harness's environment is more of a context)
    */
   private _documentRoot: Element;

   constructor(
      rawRootElement: Element,
      { documentRoot }: { documentRoot: Element }
   ) {
      super(rawRootElement);
      this._documentRoot = documentRoot;
   }

   static getNativeElement(element: TestElement) {
      if (element instanceof UnitTestElement) {
         return element.element
      }
      throw new Error("This TestElement was not created by the CypressHarnessEnvironment")
   }

   async forceStabilize(): Promise<void> {
      const window = this._documentRoot.ownerDocument.defaultView
      if (window) {
         await new Promise(window.requestAnimationFrame)
      } else {
         throw new Error('Could not get window object')
      }
   }

   waitForTasksOutsideAngular(): Promise<void> {
      throw new Error('Method not implemented.');
   }

   protected getDocumentRoot(): Element {
      return this._documentRoot;
   }

   protected createTestElement(element: Element): TestElement {
      return new UnitTestElement(element, () => Promise.resolve());
   }

   protected createEnvironment(element: Element): HarnessEnvironment<Element> {
      return new CypressHarnessEnvironment(element, {
         documentRoot: this._documentRoot,
      });
   }

   protected async getAllRawElements(selector: string): Promise<Element[]> {
      return Array.from(this.rawRootElement.querySelectorAll(selector));
   }

   async waitForStable<T>(expr: (skip: () => never) => T): Promise<Awaited<T>>
   async waitForStable<T>(expr: () => T): StableResult<T>
   // noinspection DuplicatedCode
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
