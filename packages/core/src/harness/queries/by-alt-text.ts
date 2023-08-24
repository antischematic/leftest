import { ComponentHarness } from "../component-harness"
import { predicate } from "../harness-predicate"
import { matchText, TextPattern } from "./by-text"

export function byAltText(pattern: TextPattern) {
   return predicate(
      `with alt text matching pattern: ${pattern}`,
      async function byTestId(harness: ComponentHarness) {
         return matchText(harness.host().getAttribute('alt'), pattern)
      }
   )
}
