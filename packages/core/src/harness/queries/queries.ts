import { byAltText } from "./by-alt-text"
import { byDisplayValue } from "./by-display-value"
import { byTitle } from "./by-title"
import { byTestId } from "./by-test-id"
import { byPlaceholderText,  } from "./by-placeholder-text"
import { byLabelText } from "./by-label-text"
import { byText, TextPattern } from "./by-text"
import {
   BaseHarnessFilters,
   ComponentHarness,
   ComponentHarnessConstructor,
   HarnessPredicate,
   query,
   TestElementHarness,
} from "../component-harness"
import { AriaRole, selector, forRole } from "../selector"
import { AriaOptions, byAria } from "./by-aria"

export function queryByRole(role: AriaRole, options: AriaOptions = {}): HarnessPredicate<TestElementHarness> {
   return query(forRole(role), byAria(options))
}

export function queryByText(text: TextPattern, selector?: string): HarnessPredicate<TestElementHarness> {
   return query(selector, byText(text))
}

export function queryByLabelText(text: TextPattern, selector?: string): HarnessPredicate<TestElementHarness> {
   return query(selector, byLabelText(text))
}

export function queryByPlaceholderText(text: TextPattern, selector?: string): HarnessPredicate<TestElementHarness> {
   return query(selector, byPlaceholderText(text))
}

export function queryByTestId(testId: string): HarnessPredicate<TestElementHarness> {
   return query(byTestId(testId))
}

export function queryByTitle(text: TextPattern, selector?: string): HarnessPredicate<TestElementHarness> {
   return query(selector, byTitle(text))
}

export function queryByDisplayValue(text: TextPattern, selector?: string): HarnessPredicate<TestElementHarness> {
   return query(selector, byDisplayValue(text))
}

export function queryByAltText(text: TextPattern, selector?: string): HarnessPredicate<TestElementHarness> {
   return query(selector, byAltText(text))
}

export function queryBy(options: BaseQueryFilters): HarnessPredicate<TestElementHarness> {
   const predicate = options.role ? queryByRole(options.role) : query(options.selector)
   addQueries(predicate, options)
   return predicate
}

function addQueries(predicate: HarnessPredicate<any>, options: BaseQueryFilters) {
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
   if (options.testId) {
      const filter = byTestId(options.testId)
      predicate.add(filter.name, filter)
   }
   if (options.text) {
      const filter = byText(options.text)
      predicate.add(filter.name, filter)
   }
}

export interface BaseQueryFilters extends BaseHarnessFilters, AriaOptions {
   altText?: TextPattern
   displayValue?: TextPattern
   labelText?: TextPattern
   placeholderText?: TextPattern
   role?: AriaRole
   testId?: string
   text?: TextPattern
}

export class Query<T extends ComponentHarness> extends HarnessPredicate<T> {
   constructor(harness: ComponentHarnessConstructor<T>, options: BaseQueryFilters) {
      super(harness, {
         ancestor: options.ancestor,
         selector: options.role ? forRole(options.role) : options.selector ? selector(options.selector) : undefined
      })
      this._addQueryOptions(options)
   }

   private _addQueryOptions(options: BaseQueryFilters) {
      const hasAria = options.name || options.description || options.visible || options.hidden
      addQueries(this, options)
      if (hasAria) {
         const filter = byAria(options)
         this.add(filter.name, filter)
      }
   }
}
