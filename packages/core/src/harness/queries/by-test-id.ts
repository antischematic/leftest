import { forTestId } from "../selector"
import { ComponentHarness, predicate } from "../component-harness"

export function byTestId(pattern: string) {
   return predicate(
      `with testId matching pattern: ${pattern}`,
      async function byTestId(harness: ComponentHarness) {
         return harness.host().matchesSelector(forTestId(pattern))
      }
   )
}
