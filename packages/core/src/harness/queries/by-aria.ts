
import { parallel } from "../change-detection"
import { ComponentHarness } from "../component-harness"
import { AsyncPredicate, predicate } from "../harness-predicate"
import { TestElement } from "../test-element"
import { matchText, TextPattern } from "./by-text"
import {
   computeAccessibleDescription,
   computeAccessibleName,
   isSubtreeInaccessible,
   isInaccessible
} from "dom-accessibility-api"

export interface AriaFilters {
   name?: TextPattern
   description?: TextPattern
   hidden?: boolean
   visible?: boolean
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

export function byAria(options: AriaFilters = {}): AsyncPredicate<ComponentHarness> {
   const { visible, hidden = false, name, description } = options
   return predicate(
      `match accessible element${Object.keys(options).length ? `\n\twith options:\n${prettyOptions(options)}` : ''}`,
      async function byAria(harness: ComponentHarness, cache: WeakMap<any, any>) {
         const host = harness.host()
         const element = await getElement(host)
         if (!element) {
            return false
         } else if (name && !await matchText(computeAccessibleName(element), name)) {
            return false
         } else if (description && !await matchText(computeAccessibleDescription(element), description)) {
            return false
         }
         if (hidden && visible === true) {
            return true
         }
         if (!hidden && visible === false) {
            return false
         }

         function cachedIsSubtreeInaccessible(element: Element) {
            if (!cache.has(element)) {
               cache.set(element, isSubtreeInaccessible(element))
            }

            return cache.get(element) as boolean
         }

         return isInaccessible(element, { isSubtreeInaccessible: cachedIsSubtreeInaccessible }) === hidden
      }
   )
}
