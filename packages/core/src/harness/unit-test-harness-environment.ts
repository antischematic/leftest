import { ComponentHarness } from "./component-harness"
import { HarnessEnvironment } from "./harness-environment"
import { HarnessQuery } from "./harness-predicate"
import { TestElement } from "./test-element"
import { UnitTestElement } from "./unit-test-element"


export class UnitTestHarnessEnvironment extends HarnessEnvironment<Element> {
   static getHarness<T extends ComponentHarness>(harnessType: HarnessQuery<T>): Promise<T> {
      return new UnitTestHarnessEnvironment(document.body).getHarness(harnessType)
   }

   static getAllHarnesses<T extends ComponentHarness>(harnessType: HarnessQuery<T>): Promise<T[]> {
      return new UnitTestHarnessEnvironment(document.body).getAllHarnesses(harnessType)
   }

   static getHarnessForContainer<T extends ComponentHarness>(element: Element, harnessType: HarnessQuery<T>): Promise<T> {
      return new UnitTestHarnessEnvironment(element).getHarness(harnessType)
   }

   static getAllHarnessesForContainer<T extends ComponentHarness>(element: Element, harnessType: HarnessQuery<T>): Promise<T[]> {
      return new UnitTestHarnessEnvironment(element).getAllHarnesses(harnessType)
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

   protected async getAllRawElements(selector: string): Promise<Element[]> {
      return Array.from(this.rawRootElement.querySelectorAll(selector));
   }
}
