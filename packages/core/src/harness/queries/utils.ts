function getWindowObject(element: Element) {
   const window = element.ownerDocument.defaultView
   if (!window) {
      throw new Error("Cannot compute accessibility without window object")
   }
   return window
}

/**
 * Partial implementation https://www.w3.org/TR/wai-aria-1.2/#tree_exclusion
 * which should only be used for elements with a non-presentational role i.e.
 * `role="none"` and `role="presentation"` will not be excluded.
 *
 * Implements aria-hidden semantics (i.e. parent overrides child)
 * Ignores "Child Presentational: True" characteristics
 *
 * can be used to return cached results from previous isSubtreeInaccessible calls
 * @returns true if excluded, otherwise false
 */
export function isInaccessible(element: Element) {
   const window = getWindowObject(element)
   // since visibility is inherited we can exit early
   if (window.getComputedStyle(element).visibility === 'hidden') {
      return true
   }

   let currentElement: Element | null = element
   while (currentElement) {
      if (isSubtreeInaccessible(currentElement)) {
         return true
      }

      currentElement = currentElement.parentElement
   }

   return false
}

/**
 * @returns `true` if `element` and its subtree are inaccessible
 */
function isSubtreeInaccessible(element: Element) {
   if (element instanceof HTMLElement && element.hidden) {
      return true
   }

   if (element.getAttribute('aria-hidden') === 'true') {
      return true
   }

   const window = getWindowObject(element)

   return window.getComputedStyle(element).display === 'none';
}
