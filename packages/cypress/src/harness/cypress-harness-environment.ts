import {
   ComponentHarness,
   HarnessEnvironment,
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

   static getNativeElement(element: TestElement | ComponentHarness): Element {
      if (element instanceof UnitTestElement) {
         return element.element
      }
      if (element instanceof ComponentHarness) {
         return this.getNativeElement(element.host())
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
}
