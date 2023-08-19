import { ComponentHarness } from "../component-harness"
import { matchText, TextPredicate } from "./by-text"

export function byLabelText(pattern: string | RegExp | TextPredicate) {
   return async function byLabelText(harness: ComponentHarness) {
      const host = await harness.host()
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
}
