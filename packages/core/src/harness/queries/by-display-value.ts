import { ComponentHarness, predicate } from "../component-harness"
import { matchText, TextPredicate } from "./by-text"

export function byDisplayValue(pattern: string | RegExp | TextPredicate) {
   return predicate(
      `match display value\n\twith options:\n\t\tpattern: ${pattern}\n`,
      async function byDisplayValue(harness: ComponentHarness) {
         const host = await harness.host()
         const tagName = await host.getProperty('tagName')
         switch (tagName) {
            case "SELECT": {
               const options = await host.getProperty<HTMLOptionsCollection>('options')
               for (const option of Array.from(options)) {
                  if (!option.selected) {
                     continue
                  }
                  if (await matchText(option.textContent, pattern)) {
                     return true
                  }
               }
               break
            }
            case "TEXTAREA":
            case "INPUT": {
               const type = await host.getProperty<string>('type')
               switch (type) {
                  case "checkbox": {
                     const checked = await host.getProperty<number>('checked')
                     const indeterminate = await host.getProperty<number>('indeterminate')
                     return matchText(indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked', pattern)
                  }
               }
               const value = await host.getProperty<string>('value')
               return matchText(value, pattern)
            }
         }
         return false
      }
   )
}
