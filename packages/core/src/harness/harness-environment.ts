/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { parallel } from "./change-detection"
import {
   ComponentHarness,
   ComponentHarnessConstructor,
   ExtraOptions,
   HarnessLoader,
   LocatorFactory,
   LocatorFnResult,
   StableResult,
} from "./component-harness"
import {
   AsyncFactoryFn,
   HarnessPredicate,
   HarnessQuery,
} from "./harness-predicate"
import { TestElement } from "./test-element"

/** Parsed form of the queries passed to the `locatorFor*` methods. */
type ParsedQueries<T extends ComponentHarness> = {
   /** The full list of queries, in their original order. */
   allQueries: (string | HarnessPredicate<T>)[]
   /**
    * A filtered view of `allQueries` containing only the queries that are looking for a
    * `ComponentHarness`
    */
   harnessQueries: HarnessPredicate<T>[]
   /**
    * A filtered view of `allQueries` containing only the queries that are looking for a
    * `TestElement`
    */
   elementQueries: string[]
   /** The set of all `ComponentHarness` subclasses represented in the original query list. */
   harnessTypes: Set<ComponentHarnessConstructor<T>>
}

/**
 * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
 * different test environments (e.g. testbed, protractor, etc.). This class implements the
 * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
 * element type, `E`, used by the particular test environment.
 */
export abstract class HarnessEnvironment<E>
   implements HarnessLoader, LocatorFactory
{
   // Implemented as part of the `LocatorFactory` interface.
   get rootElement(): TestElement {
      this._rootElement =
         this._rootElement || this.createTestElement(this.rawRootElement)
      return this._rootElement
   }
   set rootElement(element: TestElement) {
      this._rootElement = element
   }
   private _rootElement: TestElement | undefined

   protected constructor(protected rawRootElement: E) {}

   // Implemented as part of the `LocatorFactory` interface.
   documentRootLocatorFactory(): LocatorFactory {
      return this.createEnvironment(this.getDocumentRoot())
   }

   // Implemented as part of the `LocatorFactory` interface.
   locatorFor<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T>> {
      return async (options) =>
         (await _assertResultFound(
            this._waitForResults(() => this._getAllHarnessesAndTestElements(queries), options),
            _getDescriptionForLocatorForQueries(queries),
            options?.count ?? 1
         ))[0]
   }

   // Implemented as part of the `LocatorFactory` interface.
   locatorForOptional<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T> | null, boolean | null> {
      return async (options) =>
         (await _assertResultFound(
            this._waitForResults(() => this._getAllHarnessesAndTestElements(queries), options),
            _getDescriptionForLocatorForQueries(queries),
            options?.count ?? -1
         ))[0] || null
   }

   // Implemented as part of the `LocatorFactory` interface.
   locatorForAll<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T>[]> {
      return (options) => _assertResultFound(
         this._waitForResults(() => this._getAllHarnessesAndTestElements(queries), options),
         _getDescriptionForLocatorForQueries(queries),
         options?.count ?? -1
      )
   }

   // Implemented as part of the `LocatorFactory` interface.
   async rootHarnessLoader(): Promise<HarnessLoader> {
      return this
   }

   // Implemented as part of the `LocatorFactory` interface.
   async harnessLoaderFor(
      selector: string,
      options?: ExtraOptions,
   ): Promise<HarnessLoader> {
      return this.createEnvironment(
         (await _assertResultFound(this._waitForResults(() => this.getAllRawElements(selector), options), [
            _getDescriptionForHarnessLoaderQuery(selector),
         ], options?.count ?? 1))[0],
      )
   }

   // Implemented as part of the `LocatorFactory` interface.
   async harnessLoaderForOptional(
      selector: string,
      options?: ExtraOptions,
   ): Promise<HarnessLoader | null> {
      const elements = await _assertResultFound(this._waitForResults(() => this.getAllRawElements(selector), options), [
         _getDescriptionForHarnessLoaderQuery(selector),
      ], options?.count ?? -1)

      return elements[0] ? this.createEnvironment(elements[0]) : null
   }

   // Implemented as part of the `LocatorFactory` interface.
   async harnessLoaderForAll(
      selector: string,
      options?: ExtraOptions,
   ): Promise<HarnessLoader[]> {
      const elements = await _assertResultFound(this._waitForResults(() => this.getAllRawElements(selector), options), [
         _getDescriptionForHarnessLoaderQuery(selector),
      ], options?.count ?? 0)
      return elements.map((element) => this.createEnvironment(element))
   }

   // Implemented as part of the `HarnessLoader` interface.
   getHarness<T extends ComponentHarness>(
      query: HarnessQuery<T>,
      options?: ExtraOptions,
   ): Promise<T> {
      return this.locatorFor(query)(options)
   }

   // Implemented as part of the `HarnessLoader` interface.
   getHarnessOrNull<T extends ComponentHarness>(
      query: HarnessQuery<T>,
      options?: ExtraOptions,
   ): Promise<T | null> {
      return this.locatorForOptional(query)(options)
   }

   // Implemented as part of the `HarnessLoader` interface.
   getAllHarnesses<T extends ComponentHarness>(
      query: HarnessQuery<T>,
      options?: ExtraOptions,
   ): Promise<T[]> {
      return this.locatorForAll(query)(options)
   }

   // Implemented as part of the `HarnessLoader` interface.
   async hasHarness<T extends ComponentHarness>(
      query: HarnessQuery<T>,
      options?: ExtraOptions
   ): Promise<boolean> {
      return (await this.locatorForOptional(query)()) !== null
   }

   // Implemented as part of the `HarnessLoader` interface.
   async getChildLoader(
      selector: string,
      options?: ExtraOptions,
   ): Promise<HarnessLoader> {
      return this.createEnvironment(
         (await _assertResultFound(this.getAllRawElements(selector), [
            _getDescriptionForHarnessLoaderQuery(selector),
         ], options?.count ?? 1))[0],
      )
   }

   // Implemented as part of the `HarnessLoader` interface.
   async getAllChildLoaders(
      selector: string,
      options?: ExtraOptions,
   ): Promise<HarnessLoader[]> {
      return (await this.getAllRawElements(selector)).map((e) =>
         this.createEnvironment(e),
      )
   }

   /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
   protected createComponentHarness<T extends ComponentHarness>(
      harnessType: ComponentHarnessConstructor<T>,
      element: E,
   ): T {
      return new harnessType(this.createEnvironment(element))
   }

   // Part of LocatorFactory interface, subclasses will implement.
   abstract forceStabilize(): Promise<void>

   // Part of LocatorFactory interface, subclasses will implement.
   abstract waitForTasksOutsideAngular(): Promise<void>

   /** Gets the root element for the document. */
   protected abstract getDocumentRoot(): E

   /** Creates a `TestElement` from a raw element. */
   protected abstract createTestElement(element: E): TestElement

   /** Creates a `HarnessLoader` rooted at the given raw element. */
   protected abstract createEnvironment(element: E): HarnessEnvironment<E>

   /**
    * Gets a list of all elements matching the given selector under this environment's root element.
    */
   protected abstract getAllRawElements(selector: string): Promise<E[]>

   /**
    * Matches the given raw elements with the given list of element and harness queries to produce a
    * list of matched harnesses and test elements.
    */
   private async _getAllHarnessesAndTestElements<
      T extends (HarnessQuery<any> | string)[],
   >(queries: T): Promise<LocatorFnResult<T>[]> {
      if (!queries.length) {
         throw Error(
            "CDK Component harness query must contain at least one element.",
         )
      }

      const { allQueries, harnessQueries, elementQueries, harnessTypes } =
         _parseQueries(queries)

      // Combine all of the queries into one large comma-delimited selector and use it to get all raw
      // elements matching any of the individual queries.
      const rawElements = await this.getAllRawElements(
         [
            ...elementQueries,
            ...harnessQueries.map((predicate) => predicate.getSelector()),
         ].join(","),
      )

      // If every query is searching for the same harness subclass, we know every result corresponds
      // to an instance of that subclass. Likewise, if every query is for a `TestElement`, we know
      // every result corresponds to a `TestElement`. Otherwise we need to verify which result was
      // found by which selector so it can be matched to the appropriate instance.
      const skipSelectorCheck =
         (elementQueries.length === 0 && harnessTypes.size === 1) ||
         harnessQueries.length === 0

      const perElementMatches = await parallel(() =>
         rawElements.map(async (rawElement) => {
            const testElement = this.createTestElement(rawElement)
            const allResultsForElement = await parallel(
               // For each query, get `null` if it doesn't match, or a `TestElement` or
               // `ComponentHarness` as appropriate if it does match. This gives us everything that
               // matches the current raw element, but it may contain duplicate entries (e.g.
               // multiple `TestElement` or multiple `ComponentHarness` of the same type).
               () =>
                  allQueries.map((query) =>
                     this._getQueryResultForElement(
                        query,
                        rawElement,
                        testElement,
                        skipSelectorCheck,
                     ),
                  ),
            )
            return _removeDuplicateQueryResults(allResultsForElement)
         }),
      )
      return ([] as any).concat(...perElementMatches)
   }

   private async _waitForResults<T extends Promise<any[]>>(
      expr: () => T,
      options?: ExtraOptions,
   ): Promise<Awaited<T>> {
      const wait = options?.wait
      const shouldWait = !!wait
      const count = options?.count ?? 1
      const timeout = typeof wait === "number" ? wait : 4000
      const then = Date.now()
      let results = await expr()

      if (shouldWait) {
         while (true) {
            if ((count === 0 && results.length === 0) || (count !== 0 && results.length >= count) || (Date.now() - then >= timeout)) {
               break
            }
            await this.forceStabilize()
            results = await expr()
         }
      }

      return results
   }

   /**
    * Check whether the given query matches the given element, if it does return the matched
    * `TestElement` or `ComponentHarness`, if it does not, return null. In cases where the caller
    * knows for sure that the query matches the element's selector, `skipSelectorCheck` can be used
    * to skip verification and optimize performance.
    */
   private async _getQueryResultForElement<T extends ComponentHarness>(
      query: string | HarnessPredicate<T>,
      rawElement: E,
      testElement: TestElement,
      skipSelectorCheck = false,
   ): Promise<T | TestElement | null> {
      if (typeof query === "string") {
         return skipSelectorCheck || (await testElement.matchesSelector(query))
            ? testElement
            : null
      }
      if (
         skipSelectorCheck ||
         (await testElement.matchesSelector(query.getSelector()))
      ) {
         const harness = this.createComponentHarness(
            query.harnessType,
            rawElement,
         )
         return (await query.evaluate(harness)) ? harness : null
      }
      return null
   }

   /**
    * Evaluates an expression on each frame until it returns a truthy result. A value is considered
    * stable if it doesn't change for two consecutive frames. Values are compared with strict equality for primitives and
    * JSON.stringify for objects.
    *
    * @param expr The expression to be evaluated
    * @returns The first stable truthy result
    */
   async waitForStable<T>(expr: () => T): StableResult<T> {
      let previous: T | undefined
      while (true) {
         let result: T | undefined
         result = await expr()
         if (previous !== undefined && (result === previous || JSON.stringify(result) === JSON.stringify(previous))) {
            return previous as StableResult<T>
         }
         previous = result
         await this.forceStabilize()
      }
   }
}

/**
 * Parses a list of queries in the format accepted by the `locatorFor*` methods into an easier to
 * work with format.
 */
function _parseQueries<T extends (HarnessQuery<any> | string)[]>(
   queries: T,
): ParsedQueries<LocatorFnResult<T> & ComponentHarness> {
   const allQueries = []
   const harnessQueries = []
   const elementQueries = []
   const harnessTypes = new Set<
      ComponentHarnessConstructor<LocatorFnResult<T> & ComponentHarness>
   >()

   for (const query of queries) {
      if (typeof query === "string") {
         allQueries.push(query)
         elementQueries.push(query)
      } else {
         const predicate =
            query instanceof HarnessPredicate
               ? query
               : new HarnessPredicate(query, {})
         allQueries.push(predicate)
         harnessQueries.push(predicate)
         harnessTypes.add(predicate.harnessType)
      }
   }

   return { allQueries, harnessQueries, elementQueries, harnessTypes }
}

/**
 * Removes duplicate query results for a particular element. (e.g. multiple `TestElement`
 * instances or multiple instances of the same `ComponentHarness` class.
 */
async function _removeDuplicateQueryResults<
   T extends (ComponentHarness | TestElement | null)[],
>(results: T): Promise<T> {
   let testElementMatched = false
   const matchedHarnessTypes = new Set()
   const dedupedMatches = []
   for (const result of results) {
      if (!result) {
         continue
      }
      if (result instanceof ComponentHarness) {
         if (!matchedHarnessTypes.has(result.constructor)) {
            matchedHarnessTypes.add(result.constructor)
            dedupedMatches.push(result)
         }
      } else if (!testElementMatched) {
         testElementMatched = true
         dedupedMatches.push(result)
      }
   }
   return dedupedMatches as T
}

/** Verifies that there is at least one result in an array. */
async function _assertResultFound<T extends any[]>(
   results: Promise<T>,
   queryDescriptions: string[],
   count: number
): Promise<T> {
   const result = await results
   if (count < 0) {
      return result
   }
   if (count && count > 0 && result.length < count) {
      throw Error(
         `Expected at least ${count} element${count === 1 ? '' : 's'} matching one of the following queries:\n` +
         queryDescriptions.map((desc) => `(${desc})`).join(",\n"),
      )
   } else if (count === 0 && result.length > 0) {
      throw Error(
         `Expected zero elements matching one of the following queries:\n` +
         queryDescriptions.map((desc) => `(${desc})`).join(",\n"),
      )
   }
   return result
}

/** Gets a list of description strings from a list of queries. */
function _getDescriptionForLocatorForQueries(
   queries: (string | HarnessQuery<any>)[],
) {
   return queries.map((query) =>
      typeof query === "string"
         ? _getDescriptionForTestElementQuery(query)
         : _getDescriptionForComponentHarnessQuery(query),
   )
}

/** Gets a description string for a `ComponentHarness` query. */
function _getDescriptionForComponentHarnessQuery(query: HarnessQuery<any>) {
   const harnessPredicate =
      query instanceof HarnessPredicate
         ? query
         : new HarnessPredicate(query, {})
   const { name, hostSelector } = harnessPredicate.harnessType
   const description = `${name} with host element matching selector: "${hostSelector}"`
   const constraints = harnessPredicate.getDescription()
   return (
      description +
      (constraints
         ? ` satisfying the constraints: ${harnessPredicate.getDescription()}`
         : "")
   )
}

/** Gets a description string for a `TestElement` query. */
function _getDescriptionForTestElementQuery(selector: string) {
   return `TestElement for element matching selector: "${selector}"`
}

/** Gets a description string for a `HarnessLoader` query. */
function _getDescriptionForHarnessLoaderQuery(selector: string) {
   return `HarnessLoader for element matching selector: "${selector}"`
}
