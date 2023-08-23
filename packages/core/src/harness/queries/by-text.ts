import { ComponentHarness, HarnessPredicate } from "../component-harness"

export type TextPredicate = (text: string) => boolean | Promise<boolean>

export type TextPattern = string | RegExp | TextPredicate

export function byText(pattern: TextPattern) {
   return async function byText(harness: ComponentHarness) {
      const textContent = await harness.host().text()
      return matchText(textContent, pattern)
   }
}

export async function matchText(value: string | null | Promise<string | null>, pattern: string | null | RegExp | TextPredicate) {
   value = await value
   if (typeof pattern === "function") {
      return value ? pattern(value) : false
   }
   return HarnessPredicate.stringMatches(value, pattern);
}
