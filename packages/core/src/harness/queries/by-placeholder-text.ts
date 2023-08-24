import { ComponentHarness } from "../component-harness"
import { predicate } from "../harness-predicate"
import { matchText, TextPattern } from "./by-text"

export function byPlaceholderText(pattern: TextPattern) {
   return predicate(
      `with placeholder text matching pattern: ${pattern}`,
      async function byTestId(harness: ComponentHarness) {
         return matchText(harness.host().getAttribute('placeholder'), pattern)
      }
   )
}
