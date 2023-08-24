/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { ElementDimensions } from "./element-dimensions"
import {
   AsyncFactoryFn,
   AsyncPredicate,
   BaseHarnessFilters,
   HarnessPredicate,
   HarnessQuery,
} from "./harness-predicate"
import { byAltText } from "./queries/by-alt-text"
import { byDisplayValue } from "./queries/by-display-value"
import { byTitle } from "./queries/by-title"
import { byPlaceholderText } from "./queries/by-placeholder-text"
import { byLabelText } from "./queries/by-label-text"
import { byText, TextPattern } from "./queries/by-text"
import { AriaFilters, byAria } from "./queries/by-aria"
import { QueryFilters, TestElementHarness as ITestElementHarness } from "./queries/types"
import { AriaRole, forRole, forTestId } from "./selector"
import { EventData, ModifierKeys, TestElement, TestKey, TextOptions } from "./test-element"

/**
 * The result type obtained when searching using a particular list of queries. This type depends on
 * the particular items being queried.
 * - If one of the queries is for a `ComponentHarnessConstructor<C1>`, it means that the result
 *   might be a harness of type `C1`
 * - If one of the queries is for a `HarnessPredicate<C2>`, it means that the result might be a
 *   harness of type `C2`
 * - If one of the queries is for a `string`, it means that the result might be a `TestElement`.
 *
 * Since we don't know for sure which query will match, the result type if the union of the types
 * for all possible results.
 *
 * e.g.
 * The type:
 * `LocatorFnResult&lt;[
 *   ComponentHarnessConstructor&lt;MyHarness&gt;,
 *   HarnessPredicate&lt;MyOtherHarness&gt;,
 *   string
 * ]&gt;`
 * is equivalent to:
 * `MyHarness | MyOtherHarness | TestElement`.
 */
export type LocatorFnResult<T extends (HarnessQuery<any> | string)[]> = {
   [I in keyof T]: T[I] extends new (...args: any[]) => infer C // Map `ComponentHarnessConstructor<C>` to `C`.
      ? C
      : // Map `HarnessPredicate<C>` to `C`.
      T[I] extends { harnessType: new (...args: any[]) => infer C }
      ? C
      : // Map `string` to `TestElement`.
      T[I] extends string
      ? TestElement
      : // Map everything else to `never` (should not happen due to the type constraint on `T`).
        never
}[number]

/**
 * Interface used to load ComponentHarness objects. This interface is used by test authors to
 * instantiate `ComponentHarness`es.
 */
export interface HarnessLoader {
   /**
    * Searches for an element with the given selector under the current instances's root element,
    * and returns a `HarnessLoader` rooted at the matching element. If multiple elements match the
    * selector, the first is used. If no elements match, an error is thrown.
    * @param selector The selector for the root element of the new `HarnessLoader`
    * @return A `HarnessLoader` rooted at the element matching the given selector.
    * @throws If a matching element can't be found.
    */
   getChildLoader(selector: string): Promise<HarnessLoader>

   /**
    * Searches for all elements with the given selector under the current instances's root element,
    * and returns an array of `HarnessLoader`s, one for each matching element, rooted at that
    * element.
    * @param selector The selector for the root element of the new `HarnessLoader`
    * @return A list of `HarnessLoader`s, one for each matching element, rooted at that element.
    */
   getAllChildLoaders(selector: string): Promise<HarnessLoader[]>

   /**
    * Searches for an instance of the component corresponding to the given harness type under the
    * `HarnessLoader`'s root element, and returns a `ComponentHarness` for that instance. If multiple
    * matching components are found, a harness for the first one is returned. If no matching
    * component is found, an error is thrown.
    * @param query A query for a harness to create
    * @return An instance of the given harness type
    * @throws If a matching component instance can't be found.
    */
   getHarness<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T>

   /**
    * Searches for an instance of the component corresponding to the given harness type under the
    * `HarnessLoader`'s root element, and returns a `ComponentHarness` for that instance. If multiple
    * matching components are found, a harness for the first one is returned. If no matching
    * component is found, null is returned.
    * @param query A query for a harness to create
    * @return An instance of the given harness type (or null if not found).
    */
   getHarnessOrNull<T extends ComponentHarness>(
      query: HarnessQuery<T>,
   ): Promise<T | null>

   /**
    * Searches for all instances of the component corresponding to the given harness type under the
    * `HarnessLoader`'s root element, and returns a list `ComponentHarness` for each instance.
    * @param query A query for a harness to create
    * @return A list instances of the given harness type.
    */
   getAllHarnesses<T extends ComponentHarness>(
      query: HarnessQuery<T>,
   ): Promise<T[]>

   /**
    * Searches for an instance of the component corresponding to the given harness type under the
    * `HarnessLoader`'s root element, and returns a boolean indicating if any were found.
    * @param query A query for a harness to create
    * @return A boolean indicating if an instance was found.
    */
   hasHarness<T extends ComponentHarness>(
      query: HarnessQuery<T>,
   ): Promise<boolean>
}

/**
 * Interface used to create asynchronous locator functions used find elements and component
 * harnesses. This interface is used by `ComponentHarness` authors to create locator functions for
 * their `ComponentHarness` subclass.
 */
export interface LocatorFactory {
   /** Gets a locator factory rooted at the document root. */
   documentRootLocatorFactory(): LocatorFactory

   /** The root element of this `LocatorFactory` as a `TestElement`. */
   rootElement: TestElement

   /**
    * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
    * or element under the root element of this `LocatorFactory`.
    * @param queries A list of queries specifying which harnesses and elements to search for:
    *   - A `string` searches for elements matching the CSS selector specified by the string.
    *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
    *     given class.
    *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
    *     predicate.
    * @return An asynchronous locator function that searches for and returns a `Promise` for the
    *   first element or harness matching the given search criteria. Matches are ordered first by
    *   order in the DOM, and second by order in the queries list. If no matches are found, the
    *   `Promise` rejects. The type that the `Promise` resolves to is a union of all result types for
    *   each query.
    *
    * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
    * `DivHarness.hostSelector === 'div'`:
    * - `await lf.locatorFor(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
    * - `await lf.locatorFor('div', DivHarness)()` gets a `TestElement` instance for `#d1`
    * - `await lf.locatorFor('span')()` throws because the `Promise` rejects.
    */
   locatorFor<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T>>

   /**
    * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
    * or element under the root element of this `LocatorFactory`.
    * @param queries A list of queries specifying which harnesses and elements to search for:
    *   - A `string` searches for elements matching the CSS selector specified by the string.
    *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
    *     given class.
    *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
    *     predicate.
    * @return An asynchronous locator function that searches for and returns a `Promise` for the
    *   first element or harness matching the given search criteria. Matches are ordered first by
    *   order in the DOM, and second by order in the queries list. If no matches are found, the
    *   `Promise` is resolved with `null`. The type that the `Promise` resolves to is a union of all
    *   result types for each query or null.
    *
    * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
    * `DivHarness.hostSelector === 'div'`:
    * - `await lf.locatorForOptional(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
    * - `await lf.locatorForOptional('div', DivHarness)()` gets a `TestElement` instance for `#d1`
    * - `await lf.locatorForOptional('span')()` gets `null`.
    */
   locatorForOptional<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T> | null>

   /**
    * Creates an asynchronous locator function that can be used to find `ComponentHarness` instances
    * or elements under the root element of this `LocatorFactory`.
    * @param queries A list of queries specifying which harnesses and elements to search for:
    *   - A `string` searches for elements matching the CSS selector specified by the string.
    *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
    *     given class.
    *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
    *     predicate.
    * @return An asynchronous locator function that searches for and returns a `Promise` for all
    *   elements and harnesses matching the given search criteria. Matches are ordered first by
    *   order in the DOM, and second by order in the queries list. If an element matches more than
    *   one `ComponentHarness` class, the locator gets an instance of each for the same element. If
    *   an element matches multiple `string` selectors, only one `TestElement` instance is returned
    *   for that element. The type that the `Promise` resolves to is an array where each element is
    *   the union of all result types for each query.
    *
    * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
    * `DivHarness.hostSelector === 'div'` and `IdIsD1Harness.hostSelector === '#d1'`:
    * - `await lf.locatorForAll(DivHarness, 'div')()` gets `[
    *     DivHarness, // for #d1
    *     TestElement, // for #d1
    *     DivHarness, // for #d2
    *     TestElement // for #d2
    *   ]`
    * - `await lf.locatorForAll('div', '#d1')()` gets `[
    *     TestElement, // for #d1
    *     TestElement // for #d2
    *   ]`
    * - `await lf.locatorForAll(DivHarness, IdIsD1Harness)()` gets `[
    *     DivHarness, // for #d1
    *     IdIsD1Harness, // for #d1
    *     DivHarness // for #d2
    *   ]`
    * - `await lf.locatorForAll('span')()` gets `[]`.
    */
   locatorForAll<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T>[]>

   /** @return A `HarnessLoader` rooted at the root element of this `LocatorFactory`. */
   rootHarnessLoader(): Promise<HarnessLoader>

   /**
    * Gets a `HarnessLoader` instance for an element under the root of this `LocatorFactory`.
    * @param selector The selector for the root element.
    * @return A `HarnessLoader` rooted at the first element matching the given selector.
    * @throws If no matching element is found for the given selector.
    */
   harnessLoaderFor(selector: string): Promise<HarnessLoader>

   /**
    * Gets a `HarnessLoader` instance for an element under the root of this `LocatorFactory`
    * @param selector The selector for the root element.
    * @return A `HarnessLoader` rooted at the first element matching the given selector, or null if
    *     no matching element is found.
    */
   harnessLoaderForOptional(selector: string): Promise<HarnessLoader | null>

   /**
    * Gets a list of `HarnessLoader` instances, one for each matching element.
    * @param selector The selector for the root element.
    * @return A list of `HarnessLoader`, one rooted at each element matching the given selector.
    */
   harnessLoaderForAll(selector: string): Promise<HarnessLoader[]>

   /**
    * Flushes change detection and async tasks captured in the Angular zone.
    * In most cases it should not be necessary to call this manually. However, there may be some edge
    * cases where it is needed to fully flush animation events.
    */
   forceStabilize(): Promise<void>

   /**
    * Waits for all scheduled or running async tasks to complete. This allows harness
    * authors to wait for async tasks outside of the Angular zone.
    */
   waitForTasksOutsideAngular(): Promise<void>
}

/**
 * Base class for component harnesses that all component harness authors should extend. This base
 * component harness provides the basic ability to locate element and sub-component harness. It
 * should be inherited when defining user's own harness.
 */
export abstract class ComponentHarness {
   static query<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, filter: BaseHarnessFilters | AsyncPredicate<T[]>, ...predicates: AsyncPredicate<T>[]): HarnessPredicate<T> {
      filter = typeof filter === "object" ? filter : {}
      const query = new HarnessPredicate<T>(this, filter)
      if (typeof filter === "function") {
         predicates = [filter, ...predicates]
      }
      for (const predicate of predicates) {
         query.addOption(predicate.name, query.cache, predicate)
      }
      return query
   }

   static queryByRole<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, role: AriaRole, options: AriaFilters = {}): HarnessPredicate<T> {
      return this.query({ selector: forRole(role) }, byAria(options))
   }

   static queryByText<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, text: TextPattern, filters: BaseHarnessFilters = {}): HarnessPredicate<T> {
      return this.query(filters, byText(text))
   }

   static queryByLabelText<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, text: TextPattern, filters: BaseHarnessFilters = {}): HarnessPredicate<T> {
      return this.query(filters, byLabelText(text))
   }

   static queryByPlaceholderText<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, text: TextPattern, filters: BaseHarnessFilters = {}): HarnessPredicate<T> {
      return this.query(filters, byPlaceholderText(text))
   }

   static queryByTestId<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, testId: string): HarnessPredicate<T> {
      return this.query({ selector: forTestId(testId) })
   }

   static queryByTitle<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, text: TextPattern, filters: BaseHarnessFilters = {}): HarnessPredicate<T> {
      return this.query(filters, byTitle(text))
   }

   static queryByDisplayValue<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, text: TextPattern, filters: BaseHarnessFilters = {}): HarnessPredicate<T> {
      return this.query(filters, byDisplayValue(text))
   }

   static queryByAltText<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, text: TextPattern, filters: BaseHarnessFilters): HarnessPredicate<T> {
      return this.query(filters, byAltText(text))
   }

   static queryBy<T extends ComponentHarness>(this: ComponentHarnessConstructor<T>, options: QueryFilters): HarnessPredicate<T> {
      return new Query(this, options)
   }

   constructor(protected readonly locatorFactory: LocatorFactory) {}

   /** Gets a `Promise` for the `TestElement` representing the host element of the component. */
   host(): TestElement {
      return this.locatorFactory.rootElement
   }

   /**
    * Gets a `LocatorFactory` for the document root element. This factory can be used to create
    * locators for elements that a component creates outside of its own root element. (e.g. by
    * appending to document.body).
    */
   protected documentRootLocatorFactory(): LocatorFactory {
      return this.locatorFactory.documentRootLocatorFactory()
   }

   /**
    * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
    * or element under the host element of this `ComponentHarness`.
    * @param queries A list of queries specifying which harnesses and elements to search for:
    *   - A `string` searches for elements matching the CSS selector specified by the string.
    *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
    *     given class.
    *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
    *     predicate.
    * @return An asynchronous locator function that searches for and returns a `Promise` for the
    *   first element or harness matching the given search criteria. Matches are ordered first by
    *   order in the DOM, and second by order in the queries list. If no matches are found, the
    *   `Promise` rejects. The type that the `Promise` resolves to is a union of all result types for
    *   each query.
    *
    * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
    * `DivHarness.hostSelector === 'div'`:
    * - `await ch.locatorFor(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
    * - `await ch.locatorFor('div', DivHarness)()` gets a `TestElement` instance for `#d1`
    * - `await ch.locatorFor('span')()` throws because the `Promise` rejects.
    */
   protected locatorFor<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T>> {
      return this.locatorFactory.locatorFor(...queries)
   }

   /**
    * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
    * or element under the host element of this `ComponentHarness`.
    * @param queries A list of queries specifying which harnesses and elements to search for:
    *   - A `string` searches for elements matching the CSS selector specified by the string.
    *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
    *     given class.
    *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
    *     predicate.
    * @return An asynchronous locator function that searches for and returns a `Promise` for the
    *   first element or harness matching the given search criteria. Matches are ordered first by
    *   order in the DOM, and second by order in the queries list. If no matches are found, the
    *   `Promise` is resolved with `null`. The type that the `Promise` resolves to is a union of all
    *   result types for each query or null.
    *
    * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
    * `DivHarness.hostSelector === 'div'`:
    * - `await ch.locatorForOptional(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
    * - `await ch.locatorForOptional('div', DivHarness)()` gets a `TestElement` instance for `#d1`
    * - `await ch.locatorForOptional('span')()` gets `null`.
    */
   protected locatorForOptional<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T> | null> {
      return this.locatorFactory.locatorForOptional(...queries)
   }

   /**
    * Creates an asynchronous locator function that can be used to find `ComponentHarness` instances
    * or elements under the host element of this `ComponentHarness`.
    * @param queries A list of queries specifying which harnesses and elements to search for:
    *   - A `string` searches for elements matching the CSS selector specified by the string.
    *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
    *     given class.
    *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
    *     predicate.
    * @return An asynchronous locator function that searches for and returns a `Promise` for all
    *   elements and harnesses matching the given search criteria. Matches are ordered first by
    *   order in the DOM, and second by order in the queries list. If an element matches more than
    *   one `ComponentHarness` class, the locator gets an instance of each for the same element. If
    *   an element matches multiple `string` selectors, only one `TestElement` instance is returned
    *   for that element. The type that the `Promise` resolves to is an array where each element is
    *   the union of all result types for each query.
    *
    * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
    * `DivHarness.hostSelector === 'div'` and `IdIsD1Harness.hostSelector === '#d1'`:
    * - `await ch.locatorForAll(DivHarness, 'div')()` gets `[
    *     DivHarness, // for #d1
    *     TestElement, // for #d1
    *     DivHarness, // for #d2
    *     TestElement // for #d2
    *   ]`
    * - `await ch.locatorForAll('div', '#d1')()` gets `[
    *     TestElement, // for #d1
    *     TestElement // for #d2
    *   ]`
    * - `await ch.locatorForAll(DivHarness, IdIsD1Harness)()` gets `[
    *     DivHarness, // for #d1
    *     IdIsD1Harness, // for #d1
    *     DivHarness // for #d2
    *   ]`
    * - `await ch.locatorForAll('span')()` gets `[]`.
    */
   protected locatorForAll<T extends (HarnessQuery<any> | string)[]>(
      ...queries: T
   ): AsyncFactoryFn<LocatorFnResult<T>[]> {
      return this.locatorFactory.locatorForAll(...queries)
   }

   /**
    * Flushes change detection and async tasks in the Angular zone.
    * In most cases it should not be necessary to call this manually. However, there may be some edge
    * cases where it is needed to fully flush animation events.
    */
   protected async forceStabilize() {
      return this.locatorFactory.forceStabilize()
   }

   /**
    * Waits for all scheduled or running async tasks to complete. This allows harness
    * authors to wait for async tasks outside of the Angular zone.
    */
   protected async waitForTasksOutsideAngular() {
      return this.locatorFactory.waitForTasksOutsideAngular()
   }
}

/**
 * Base class for component harnesses that authors should extend if they anticipate that consumers
 * of the harness may want to access other harnesses within the `<ng-content>` of the component.
 */
export abstract class ContentContainerComponentHarness<
      S extends string = string,
   >
   extends ComponentHarness
   implements HarnessLoader
{
   async getChildLoader(selector: S): Promise<HarnessLoader> {
      return (await this.getRootHarnessLoader()).getChildLoader(selector)
   }

   async getAllChildLoaders(selector: S): Promise<HarnessLoader[]> {
      return (await this.getRootHarnessLoader()).getAllChildLoaders(selector)
   }

   async getHarness<T extends ComponentHarness>(
      query: HarnessQuery<T>,
   ): Promise<T> {
      return (await this.getRootHarnessLoader()).getHarness(query)
   }

   async getHarnessOrNull<T extends ComponentHarness>(
      query: HarnessQuery<T>,
   ): Promise<T | null> {
      return (await this.getRootHarnessLoader()).getHarnessOrNull(query)
   }

   async getAllHarnesses<T extends ComponentHarness>(
      query: HarnessQuery<T>,
   ): Promise<T[]> {
      return (await this.getRootHarnessLoader()).getAllHarnesses(query)
   }

   async hasHarness<T extends ComponentHarness>(
      query: HarnessQuery<T>,
   ): Promise<boolean> {
      return (await this.getRootHarnessLoader()).hasHarness(query)
   }

   /**
    * Gets the root harness loader from which to start
    * searching for content contained by this harness.
    */
   protected async getRootHarnessLoader(): Promise<HarnessLoader> {
      return this.locatorFactory.rootHarnessLoader()
   }
}

/** Constructor for a ComponentHarness subclass. */
export interface ComponentHarnessConstructor<T extends ComponentHarness> {
   new (locatorFactory: LocatorFactory): T

   /**
    * `ComponentHarness` subclasses must specify a static `hostSelector` property that is used to
    * find the host element for the corresponding component. This property should match the selector
    * for the Angular component.
    */
   hostSelector: string

   query(filter: BaseHarnessFilters, ...predicates: AsyncPredicate<T>[]): HarnessPredicate<T>
}

export class TestElementHarness extends ContentContainerComponentHarness implements TestElement {
   async blur(): Promise<void> {
      const host = this.host()
      return host.blur()
   }

   clear(): Promise<void> {
      return Promise.resolve(undefined)
   }

   async click(modifiers?: ModifierKeys): Promise<void>
   async click(location: "center", modifiers?: ModifierKeys): Promise<void>
   async click(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void>
   async click(...args: any[]): Promise<void> {
      const host = this.host()
      return host.click(...args)
   }

   async dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void> {
      const host = this.host()
      return host.dispatchEvent(name, data)
   }

   async focus(): Promise<void> {
      const host = this.host()
      return host.focus()
   }

   async getAttribute(name: string): Promise<string | null> {
      const host = this.host()
      return host.getAttribute(name)
   }

   async getCssValue(property: string): Promise<string> {
      const host = this.host()
      return host.getCssValue(property)
   }

   async getDimensions(): Promise<ElementDimensions> {
      const host = this.host()
      return host.getDimensions()
   }

   async getProperty<T = any>(name: string): Promise<T> {
      const host = this.host()
      return host.getProperty(name)
   }

   async hasClass(name: string): Promise<boolean> {
      const host = this.host()
      return host.hasClass(name)
   }

   async hover(): Promise<void> {
      const host = this.host()
      return host.hover()
   }

   async isFocused(): Promise<boolean> {
      const host = this.host()
      return host.isFocused()
   }

   async matchesSelector(selector: string): Promise<boolean> {
      const host = this.host()
      return host.matchesSelector(selector)
   }

   async mouseAway(): Promise<void> {
      const host = this.host()
      return host.mouseAway()
   }

   async rightClick(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void> {
      const host = this.host()
      return host.rightClick(relativeX, relativeY, modifiers)
   }

   async selectOptions(...optionIndexes: number[]): Promise<void> {
      const host = this.host()
      return host.selectOptions(...optionIndexes)
   }

   async sendKeys(...keys: (string | TestKey)[]): Promise<void>
   async sendKeys(modifiers: ModifierKeys, ...keys: (string | TestKey)[]): Promise<void>
   async sendKeys(...keys: any[]): Promise<void> {
      const host = this.host()
      return host.sendKeys(...keys)
   }

   async setContenteditableValue(value: string): Promise<void> {
      const host = this.host()
      return host.setContenteditableValue?.(value)
   }

   async setInputValue(value: string): Promise<void> {
      const host = this.host()
      return host.setInputValue(value)
   }

   async text(options?: TextOptions): Promise<string> {
      const host = this.host()
      return host.text(options)
   }

}

export function getElementHarness(selector: string): ComponentHarnessConstructor<ITestElementHarness> {
   class ElementHarness extends TestElementHarness {
      static hostSelector = selector
   }

   return ElementHarness
}

export function query(filter: BaseHarnessFilters | string | undefined, ...predicates: AsyncPredicate<ComponentHarness>[]): HarnessPredicate<ITestElementHarness> {
   const selector = typeof filter === "string" ? filter : filter?.selector
   const ancestor = typeof filter === "object" ? filter?.ancestor : undefined
   const query = new HarnessPredicate(getElementHarness(selector ?? "*"), { ancestor })
   for (const predicate of predicates) {
      query.addOption(predicate.name, query.cache, predicate)
   }
   return query
}

export function addQueries(predicate: HarnessPredicate<any>, options: QueryFilters) {
   if (options.altText) {
      const filter = byAltText(options.altText)
      predicate.add(filter.name, filter)
   }
   if (options.displayValue) {
      const filter = byDisplayValue(options.displayValue)
      predicate.add(filter.name, filter)
   }
   if (options.labelText) {
      const filter = byDisplayValue(options.labelText)
      predicate.add(filter.name, filter)
   }
   if (options.placeholderText) {
      const filter = byDisplayValue(options.placeholderText)
      predicate.add(filter.name, filter)
   }
   if (options.text) {
      const filter = byText(options.text)
      predicate.add(filter.name, filter)
   }
   const hasAria = options.name || options.description || options.visible || options.hidden
   if (hasAria) {
      const filter = byAria(options)
      predicate.add(filter.name, filter)
   }
}

export class Query<T extends ComponentHarness> extends HarnessPredicate<T> {
   constructor(harness: ComponentHarnessConstructor<T>, options: QueryFilters) {
      super(harness, options)
      this._addQueryOptions(options)
   }

   private _addQueryOptions(options: QueryFilters) {
      addQueries(this, options)
   }
}
