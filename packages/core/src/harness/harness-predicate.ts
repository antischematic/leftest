import { parallel } from "./change-detection"
import { ComponentHarness, ComponentHarnessConstructor, ExtraOptions } from "./component-harness"

/** An async function that returns a promise when called. */
export type AsyncFactoryFn<T, U extends boolean | null = boolean> = (options?: ExtraOptions) => Promise<T>
/** An async function that takes an item and returns a boolean promise */
export type AsyncPredicate<T> = (item: T) => Promise<boolean>
/** An async function that takes an item and an option value and returns a boolean promise. */
export type AsyncOptionPredicate<T, O> = (
   item: T,
   option: O,
) => Promise<boolean>
/**
 * A query for a `ComponentHarness`, which is expressed as either a `ComponentHarnessConstructor` or
 * a `HarnessPredicate`.
 */
export type HarnessQuery<T extends ComponentHarness> =
   | ComponentHarnessConstructor<T>
   | HarnessPredicate<T>

/** A set of criteria that can be used to filter a list of `ComponentHarness` instances. */
export interface BaseHarnessFilters {
   /** Only find instances whose host element matches the given selector. */
   selector?: string
   /** Only find instances that are nested under an element with the given selector. */
   ancestor?: string
}

/**
 * A class used to associate a ComponentHarness class with predicates functions that can be used to
 * filter instances of the class.
 */
export class HarnessPredicate<T extends ComponentHarness> {
   private _predicates: AsyncPredicate<T>[] = []
   private _descriptions: string[] = []
   private _ancestor!: string

   cache = new WeakMap()

   constructor(
      public harnessType: ComponentHarnessConstructor<T>,
      options: BaseHarnessFilters,
   ) {
      this._addBaseOptions(options)
   }

   /**
    * Checks if the specified nullable string value matches the given pattern.
    * @param value The nullable string value to check, or a Promise resolving to the
    *   nullable string value.
    * @param pattern The pattern the value is expected to match. If `pattern` is a string,
    *   `value` is expected to match exactly. If `pattern` is a regex, a partial match is
    *   allowed. If `pattern` is `null`, the value is expected to be `null`.
    * @return Whether the value matches the pattern.
    */
   static async stringMatches(
      value: string | null | Promise<string | null>,
      pattern: string | RegExp | null | undefined,
   ): Promise<boolean> {
      value = await value
      if (pattern == null) {
         return value === null
      } else if (value === null) {
         return false
      }
      return typeof pattern === "string"
         ? value === pattern
         : pattern.test(value)
   }

   /**
    * Adds a predicate function to be run against candidate harnesses.
    * @param description A description of this predicate that may be used in error messages.
    * @param predicate An async predicate function.
    * @return this (for method chaining).
    */
   add(description: string, predicate: AsyncPredicate<T>) {
      this._descriptions.push(description)
      this._predicates.push(predicate)
      return this
   }

   /**
    * Adds a predicate function that depends on an option value to be run against candidate
    * harnesses. If the option value is undefined, the predicate will be ignored.
    * @param name The name of the option (may be used in error messages).
    * @param option The option value.
    * @param predicate The predicate function to run if the option value is not undefined.
    * @return this (for method chaining).
    */
   addOption<O>(
      name: string,
      option: O | undefined,
      predicate: AsyncOptionPredicate<T, O>,
   ) {
      if (option !== undefined) {
         this.add(`${name} = ${_valueAsString(option)}`, (item) =>
            predicate(item, option),
         )
      }
      return this
   }

   /**
    * Filters a list of harnesses on this predicate.
    * @param harnesses The list of harnesses to filter.
    * @return A list of harnesses that satisfy this predicate.
    */
   async filter(harnesses: T[]): Promise<T[]> {
      try {
         if (harnesses.length === 0) {
            return []
         }
         const results = await parallel(() =>
            harnesses.map((h) => this.evaluate(h)),
         )
         return harnesses.filter((_, i) => results[i])
      } finally {
         this.cache = new WeakMap()
      }
   }

   /**
    * Evaluates whether the given harness satisfies this predicate.
    * @param harness The harness to check
    * @return A promise that resolves to true if the harness satisfies this predicate,
    *   and resolves to false otherwise.
    */
   async evaluate(harness: T): Promise<boolean> {
      const results = await parallel(() =>
         this._predicates.map((p) => p(harness)),
      )
      return results.reduce(
         (combined: any, current: any) => combined && current,
         true,
      )
   }

   /** Gets a description of this predicate for use in error messages. */
   getDescription() {
      return this._descriptions.join(", ")
   }

   /** Gets the selector used to find candidate elements. */
   getSelector() {
      // We don't have to go through the extra trouble if there are no ancestors.
      if (!this._ancestor) {
         return (this.harnessType.hostSelector || "").trim()
      }

      const [ancestors, ancestorPlaceholders] = _splitAndEscapeSelector(
         this._ancestor,
      )
      const [selectors, selectorPlaceholders] = _splitAndEscapeSelector(
         this.harnessType.hostSelector || "",
      )
      const result: string[] = []

      // We have to add the ancestor to each part of the host compound selector, otherwise we can get
      // incorrect results. E.g. `.ancestor .a, .ancestor .b` vs `.ancestor .a, .b`.
      ancestors.forEach((escapedAncestor) => {
         const ancestor = _restoreSelector(
            escapedAncestor,
            ancestorPlaceholders,
         )
         return selectors.forEach((escapedSelector) =>
            result.push(
               `${ancestor} ${_restoreSelector(
                  escapedSelector,
                  selectorPlaceholders,
               )}`,
            ),
         )
      })

      return result.join(", ")
   }

   /** Adds base options common to all harness types. */
   private _addBaseOptions(options: BaseHarnessFilters) {
      this._ancestor = options.ancestor || ""
      if (this._ancestor) {
         this._descriptions.push(
            `has ancestor matching selector "${this._ancestor}"`,
         )
      }
      const selector = options.selector
      if (selector !== undefined) {
         this.add(`host matches selector "${selector}"`, async (item) => {
            return item.host().matchesSelector(selector)
         })
      }
   }
}

/** Represent a value as a string for the purpose of logging. */
function _valueAsString(value: unknown) {
   if (value === undefined) {
      return "undefined"
   }
   try {
      // `JSON.stringify` doesn't handle RegExp properly, so we need a custom replacer.
      // Use a character that is unlikely to appear in real strings to denote the start and end of
      // the regex. This allows us to strip out the extra quotes around the value added by
      // `JSON.stringify`. Also do custom escaping on `"` characters to prevent `JSON.stringify`
      // from escaping them as if they were part of a string.
      const stringifiedValue = JSON.stringify(value, (_, v) =>
         v instanceof RegExp
            ? `◬MAT_RE_ESCAPE◬${v
               .toString()
               .replace(/"/g, "◬MAT_RE_ESCAPE◬")}◬MAT_RE_ESCAPE◬`
            : v,
      )
      // Strip out the extra quotes around regexes and put back the manually escaped `"` characters.
      return stringifiedValue
         .replace(/"◬MAT_RE_ESCAPE◬|◬MAT_RE_ESCAPE◬"/g, "")
         .replace(/◬MAT_RE_ESCAPE◬/g, "\"")
   } catch {
      // `JSON.stringify` will throw if the object is cyclical,
      // in this case the best we can do is report the value as `{...}`.
      return "{...}"
   }
}

/**
 * Splits up a compound selector into its parts and escapes any quoted content. The quoted content
 * has to be escaped, because it can contain commas which will throw throw us off when trying to
 * split it.
 * @param selector Selector to be split.
 * @returns The escaped string where any quoted content is replaced with a placeholder. E.g.
 * `[foo="bar"]` turns into `[foo=__cdkPlaceholder-0__]`. Use `_restoreSelector` to restore
 * the placeholders.
 */
function _splitAndEscapeSelector(
   selector: string,
): [parts: string[], placeholders: string[]] {
   const placeholders: string[] = []

   // Note that the regex doesn't account for nested quotes so something like `"ab'cd'e"` will be
   // considered as two blocks. It's a bit of an edge case, but if we find that it's a problem,
   // we can make it a bit smarter using a loop. Use this for now since it's more readable and
   // compact. More complete implementation:
   // https://github.com/angular/angular/blob/bd34bc9e89f18a/packages/compiler/src/shadow_css.ts#L655
   const result = selector.replace(/(["'][^["']*["'])/g, (_, keep) => {
      const replaceBy = `__cdkPlaceholder-${placeholders.length}__`
      placeholders.push(keep)
      return replaceBy
   })

   return [result.split(",").map((part) => part.trim()), placeholders]
}

/** Restores a selector whose content was escaped in `_splitAndEscapeSelector`. */
function _restoreSelector(selector: string, placeholders: string[]): string {
   return selector.replace(
      /__cdkPlaceholder-(\d+)__/g,
      (_, index) => placeholders[+index],
   )
}

export function predicate<T>(description: string, filter: AsyncOptionPredicate<T, WeakMap<any, any>>): AsyncPredicate<T> {
   Object.defineProperty(filter, "name", {
      value: description,
   })
   return filter as AsyncPredicate<T>
}
