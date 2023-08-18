import { withTestId } from "../selector"
import { ComponentHarness } from "../component-harness"

export function byTestId(pattern: string) {
   return async function byTestId(harness: ComponentHarness) {
      return (await harness.host()).matchesSelector(withTestId(pattern))
   }
}
