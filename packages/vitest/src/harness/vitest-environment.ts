import {
   ComponentHarness,
   ComponentHarnessConstructor,
   HarnessEnvironment,
   TestElement, UnitHarnessEnvironment,
   UnitTestElement,
} from "@antischematic/leftest"

export class VitestHarnessEnvironment extends UnitHarnessEnvironment {}

export function getHarness<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): Promise<T> {
   return VitestHarnessEnvironment.getHarness(harnessType)
}

export function getAllHarnesses<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): Promise<T[]> {
   return VitestHarnessEnvironment.getAllHarnesses(harnessType)
}

export function getHarnessForContainer<T extends ComponentHarness>(element: Element, harnessType: ComponentHarnessConstructor<T>): Promise<T> {
   return VitestHarnessEnvironment.getHarnessForContainer(element, harnessType)
}

export function getAllHarnessesForContainer<T extends ComponentHarness>(element: Element, harnessType: ComponentHarnessConstructor<T>): Promise<T[]> {
   return VitestHarnessEnvironment.getAllHarnessesForContainer(element, harnessType)
}
