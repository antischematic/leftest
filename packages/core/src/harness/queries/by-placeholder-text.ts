import { ComponentHarness, HarnessPredicate, predicate } from "../component-harness"

export function byPlaceholderText(pattern: string) {
   return predicate(
      `with placeholder text matching pattern: ${pattern}`,
      async function byTestId(harness: ComponentHarness) {
         return HarnessPredicate.stringMatches(harness.host().getAttribute('placeholder'), pattern)
      }
   )
}
