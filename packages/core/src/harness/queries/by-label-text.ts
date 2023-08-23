import { ComponentHarness, predicate } from "../component-harness"
import { matchText, TextPattern } from "./by-text"

export function byLabelText(pattern: TextPattern) {
   return predicate(
      `match label text\n\twith options:\n\t\tpattern: ${pattern}\n`,
      async function byLabelText(harness: ComponentHarness) {
         const host = harness.host()
         const labels = await host.getProperty<NodeListOf<HTMLLabelElement> | null>('labels')
         if (labels) {
            for (const label of Array.from(labels)) {
               if (await matchText(label.textContent, pattern)) {
                  return true
               }
            }
         }
         return false
      }
   )
}
