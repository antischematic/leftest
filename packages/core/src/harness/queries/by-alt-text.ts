import { ComponentHarness, HarnessPredicate, predicate } from "../component-harness"

export function byAltText(pattern: string) {
   return predicate(
      `with alt text matching pattern: ${pattern}`,
      async function byTestId(harness: ComponentHarness) {
         return HarnessPredicate.stringMatches(harness.host().getAttribute('alt'), pattern)
      }
   )
}
