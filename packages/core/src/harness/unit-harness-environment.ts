import { ComponentHarness, ComponentHarnessConstructor } from "./component-harness"
import { HarnessEnvironment } from "./harness-environment"
import { TestElement } from "./test-element"
import { UnitTestElement } from "./unit-test-element"


export class UnitHarnessEnvironment extends HarnessEnvironment<Element> {
   static getHarness<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): Promise<T> {
      return new UnitHarnessEnvironment(document.body).getHarness(harnessType)
   }

   static getAllHarnesses<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): Promise<T[]> {
      return new UnitHarnessEnvironment(document.body).getAllHarnesses(harnessType)
   }

   static getHarnessForContainer<T extends ComponentHarness>(element: Element, harnessType: ComponentHarnessConstructor<T>): Promise<T> {
      return new UnitHarnessEnvironment(element).getHarness(harnessType)
   }

   static getAllHarnessesForContainer<T extends ComponentHarness>(element: Element, harnessType: ComponentHarnessConstructor<T>): Promise<T[]> {
      return new UnitHarnessEnvironment(element).getAllHarnesses(harnessType)
   }

   async forceStabilize(): Promise<void> {
      throw new Error('Method not implemented.');
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
      return new UnitHarnessEnvironment(element)
   }

   protected async getAllRawElements(selector: string): Promise<Element[]> {
      return Array.from(this.rawRootElement.querySelectorAll(selector));
   }
}
