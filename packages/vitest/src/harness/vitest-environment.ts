import {
   ComponentHarness,
   HarnessQuery,
   TestElement,
   UnitTestHarnessEnvironment,
} from "@antischematic/leftest"

export class VitestHarnessEnvironment extends UnitTestHarnessEnvironment {}

export function getHarness<T extends ComponentHarness>(
   harnessType: HarnessQuery<T>,
): Promise<T> {
   return VitestHarnessEnvironment.getHarness(harnessType)
}

export function getAllHarnesses<T extends ComponentHarness>(
   harnessType: HarnessQuery<T>,
): Promise<T[]> {
   return VitestHarnessEnvironment.getAllHarnesses(harnessType)
}

export function getHarnessForContainer<T extends ComponentHarness>(
   element: Element,
   harnessType: HarnessQuery<T>,
): Promise<T> {
   return VitestHarnessEnvironment.getHarnessForContainer(element, harnessType)
}

export function getAllHarnessesForContainer<T extends ComponentHarness>(
   element: Element,
   harnessType: HarnessQuery<T>,
): Promise<T[]> {
   return VitestHarnessEnvironment.getAllHarnessesForContainer(
      element,
      harnessType,
   )
}

export function getNativeElement<T extends Element>(element: TestElement): T {
   return VitestHarnessEnvironment.getNativeElement<T>(element)
}

export function getRootHarnessLoader() {
   return VitestHarnessEnvironment.getRootHarnessLoader()
}
