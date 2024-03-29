import { parallel } from "../change-detection"
import { ComponentHarness } from "../component-harness"
import { predicate } from "../harness-predicate"
import { matchText, TextPattern } from "./by-text"

function getSvgTitleText(tagName: string, children: HTMLCollection) {
   if (tagName !== "svg") {
      return null
   }
   const titleNode = Array.from(children).find(node => node.tagName === 'title')
   return titleNode?.textContent ?? null
}

export function byTitle(pattern: TextPattern) {
   return predicate(
      `match title text\n\twith options:\n\t\tpattern: ${pattern}\n`,
      async function byTestId(harness: ComponentHarness) {
         const host = harness.host()
         const [title, children, tagName] = await parallel(() => [host.getAttribute('title'), host.getProperty<HTMLCollection>('children'), host.getProperty<string>('tagName')])
         return matchText(title || getSvgTitleText(tagName, children), pattern)
      }
   )
}
