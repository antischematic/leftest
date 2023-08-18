import { ComponentHarness, HarnessPredicate } from "../component-harness"

export type TextPredicate = (text: string | null) => boolean | Promise<boolean>

export function byText(pattern: string | RegExp | TextPredicate) {
   return async function byText(harness: ComponentHarness) {
      const textContent = await (await harness.host()).text()
      return matchText(textContent, pattern)
   }
}

export async function matchText(value: string | null | Promise<string> | Promise<null>, pattern: string | RegExp | TextPredicate) {
   value = await value
   if (typeof pattern === "function") {
      return pattern(value)
   }
   return HarnessPredicate.stringMatches(value, pattern.toString());
}
