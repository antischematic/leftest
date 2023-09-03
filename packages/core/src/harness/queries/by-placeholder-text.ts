import { ComponentHarness } from "../component-harness"
import { predicate } from "../harness-predicate"
import { matchText, TextPattern } from "./by-text"

export function byPlaceholderText(pattern: TextPattern) {
   return predicate(
      `match placeholder text\n\twith options:\n\t\tpattern: ${pattern}\n`,
      async function byTestId(harness: ComponentHarness) {
         return matchText(harness.host().getAttribute('placeholder'), pattern)
      }
   )
}
