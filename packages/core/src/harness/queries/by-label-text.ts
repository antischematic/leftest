import { ComponentHarness, HarnessPredicate } from "../component-harness"

export function byLabelText(pattern: string | RegExp) {
   return async function byLabelText(harness: ComponentHarness) {
      const host = await harness.host()
      const labels = await host.getProperty<NodeListOf<HTMLLabelElement> | null>('labels')
      if (labels) {
         for (const label of Array.from(labels)) {
            if (await HarnessPredicate.stringMatches(label.textContent, pattern)) {
               return true
            }
         }
      }
      return false
   }
}
