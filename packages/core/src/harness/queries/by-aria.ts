
import { parallel } from "../change-detection"
import { AsyncPredicate, ComponentHarness, predicate } from "../component-harness"
import { TestElement } from "../test-element"
import { matchText, TextPredicate } from "./by-text"
import { isInaccessible } from "./utils"
import { computeAccessibleDescription, computeAccessibleName } from "dom-accessibility-api"

export interface AriaOptions {
   name?: string | RegExp | TextPredicate
   description?: string | RegExp | TextPredicate
   hidden?: boolean
}

function prettyOptions(obj: any) {
   let pretty = ''
   for (const [key, value] of Object.entries(obj)) {
      pretty += `\t\t${key}: ${JSON.stringify(value)}\n`
   }
   return pretty
}

async function getElement(element: TestElement): Promise<Element | null> {
   const [firstElementChild, previousElementSibling, nextElementSibling, parentElement] = await parallel(() => [
      element.getProperty<Element | null>('firstElementChild'),
      element.getProperty<Element | null>('previousElementSibling'),
      element.getProperty<Element | null>('nextElementSibling'),
      element.getProperty<Element | null>('parentElement'),
   ])
   if (firstElementChild?.parentElement) {
      return firstElementChild.parentElement
   }
   if (previousElementSibling?.nextElementSibling) {
      return previousElementSibling.nextElementSibling
   }
   if (nextElementSibling?.previousElementSibling) {
      return nextElementSibling.previousElementSibling
   }
   if (parentElement?.firstElementChild) {
      return parentElement.firstElementChild
   }
   return null
}

export function byAria(options: AriaOptions = {}): AsyncPredicate<ComponentHarness> {
   const { hidden = false, name, description } = options
   return predicate(
      `matching accessible element${Object.keys(options).length ? `\n\twith options:\n${prettyOptions(options)}` : ''}`,
      async function byAria(harness: ComponentHarness) {
         const host = harness.host()
         const element = await getElement(host)
         if (!element) {
            return false
         } else if (name && !await matchText(computeAccessibleName(element), name)) {
            return false
         } else if (description && !await matchText(computeAccessibleDescription(element), description)) {
            return false
         }
         return isInaccessible(element) === hidden
      }
   )
}
