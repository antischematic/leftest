import { parallel } from "../change-detection"
import { ComponentHarness, HarnessPredicate, predicate } from "../component-harness"

function getSvgTitleText(tagName: string, children: HTMLCollection) {
   if (tagName !== "svg") {
      return null
   }
   const titleNode = Array.from(children).find(node => node.tagName === 'title')
   return titleNode?.textContent ?? null
}

export function byTitle(pattern: string) {
   return predicate(
      `with title text matching pattern: ${pattern}`,
      async function byTestId(harness: ComponentHarness) {
         const host = harness.host()
         const [title, children, tagName] = await parallel(() => [host.getAttribute('title'), host.getProperty<HTMLCollection>('children'), host.getProperty<string>('tagName')])
         return HarnessPredicate.stringMatches(title || getSvgTitleText(tagName, children), pattern)
      }
   )
}
