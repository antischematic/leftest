import {
   ComponentHarness, ExtraOptions,
   HarnessQuery,
   TestElement,
   UnitTestHarnessEnvironment,
} from "@antischematic/leftest"

export class VitestHarnessEnvironment extends UnitTestHarnessEnvironment {}

export function getHarness<T extends ComponentHarness>(
   harnessType: HarnessQuery<T>,
   options?: ExtraOptions
): Promise<T> {
   return VitestHarnessEnvironment.getHarness(harnessType, options)
}

export function getHarnessOrNull<T extends ComponentHarness>(
   harnessType: HarnessQuery<T>,
   options: ExtraOptions<true>
): Promise<T>
export function getHarnessOrNull<T extends ComponentHarness>(
   harnessType: HarnessQuery<T>,
   options: ExtraOptions<null>
): Promise<null>
export function getHarnessOrNull<T extends ComponentHarness>(
   harnessType: HarnessQuery<T>,
   options?: ExtraOptions<boolean | null>
): Promise<T | null>
export function getHarnessOrNull<T extends ComponentHarness>(
   harnessType: HarnessQuery<T>,
   options?: ExtraOptions<boolean | null>
): Promise<T | null> {
   return VitestHarnessEnvironment.getHarnessOrNull(harnessType, options)
}

export function getAllHarnesses<T extends ComponentHarness>(
   harnessType: HarnessQuery<T>,
   options?: ExtraOptions
): Promise<T[]> {
   return VitestHarnessEnvironment.getAllHarnesses(harnessType, options)
}

export function getHarnessForContainer<T extends ComponentHarness>(
   element: Element,
   harnessType: HarnessQuery<T>,
   options?: ExtraOptions
): Promise<T> {
   return VitestHarnessEnvironment.getHarnessForContainer(element, harnessType, options)
}

export function getAllHarnessesForContainer<T extends ComponentHarness>(
   element: Element,
   harnessType: HarnessQuery<T>,
   options?: ExtraOptions
): Promise<T[]> {
   return VitestHarnessEnvironment.getAllHarnessesForContainer(
      element,
      harnessType,
      options
   )
}

export function getNativeElement<T extends Element>(element: TestElement | ComponentHarness): T {
   return VitestHarnessEnvironment.getNativeElement<T>(element)
}

export function getRootHarnessLoader() {
   return VitestHarnessEnvironment.getRootHarnessLoader()
}
