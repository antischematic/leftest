
import { ComponentHarness } from "../component-harness"
import { AriaRole, withRole } from "../selector"
import { TestElement } from "../test-element"
import { matchText, TextPredicate } from "./by-text"

export interface RoleOptions {
   name?: string | RegExp | TextPredicate
}

export function byRole(role: AriaRole, options: RoleOptions = {}) {
   return async function byRole(harness: ComponentHarness) {
      const host = await harness.host()
      let matchesRole = await host.matchesSelector(withRole(role))
      if (matchesRole && options.name) {
         return matchText(getComputedLabel(host), options.name)
      }
      return matchesRole
   }
}

// @todo replace with something more comprehensive
async function getComputedLabel(element: TestElement) {
   if (element) {
      // The element's `aria-labelledby
      const ariaLabelledby = await element.getAttribute("aria-labelledby");
      const tagName = await element.getProperty('tagName')
      if (ariaLabelledby) {
         const ariaLabelledbyElement = document.getElementById(ariaLabelledby);
         if (ariaLabelledbyElement) {
            const ariaLabelledbyElementText = ariaLabelledbyElement.innerText;
            if (ariaLabelledbyElementText) return ariaLabelledbyElementText;
         }
      }

      // The element's `aria-label`
      const ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel) return ariaLabel;

      // If it's an image/etc., alternate text
      // Even if it's an empty alt attribute alt=""
      if (
         tagName === "APPLET" ||
         tagName === "AREA" ||
         tagName === "IMG" ||
         tagName === "INPUT"
      ) {
         const altText = await element.getAttribute("alt");
         if (typeof altText === "string") return altText;
      }

      // <desc> for SVGs
      if (tagName === "SVG") {
         const children = await element.getProperty<HTMLCollection>("children")
         const descElt = Array.from(children).find(el => el.tagName === "DESC");
         if (descElt) {
            const descText =
               (<HTMLElement>(<unknown>descElt)).innerText || descElt.innerHTML;
            if (descText) return descText;
         }
      }

      // The value of the element
      const innerText = await element.getProperty('innerText');
      if (innerText) return innerText;
   }
}
