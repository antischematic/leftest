import {
   addQueries,
   ComponentHarness,
   ComponentHarnessConstructor,
   query,
} from "../component-harness"
import { BaseHarnessFilters, HarnessPredicate } from "../harness-predicate"
import { AriaRole, withRole, withTestId } from "../selector"
import { byAltText } from "./by-alt-text"
import { AriaFilters, byAria } from "./by-aria"
import { byDisplayValue } from "./by-display-value"
import { byLabelText } from "./by-label-text"
import { byPlaceholderText } from "./by-placeholder-text"
import { byText, TextPattern } from "./by-text"
import { byTitle } from "./by-title"
import { QueryFilters, TestElementHarness } from "./types"

export function queryByRole(role: AriaRole, options: AriaFilters = {}): HarnessPredicate<TestElementHarness> {
   return query(withRole(role), byAria(options))
}

export function queryByText(text: TextPattern, selector?: string | BaseHarnessFilters): HarnessPredicate<TestElementHarness> {
   return query(selector, byText(text))
}

export function queryByLabelText(text: TextPattern, selector?: string | BaseHarnessFilters): HarnessPredicate<TestElementHarness> {
   return query(selector, byLabelText(text))
}

export function queryByPlaceholderText(text: TextPattern, selector?: string | BaseHarnessFilters): HarnessPredicate<TestElementHarness> {
   return query(selector, byPlaceholderText(text))
}

export function queryByTestId(testId: string): HarnessPredicate<TestElementHarness> {
   return query(withTestId(testId))
}

export function queryByTitle(text: TextPattern, selector?: string | BaseHarnessFilters): HarnessPredicate<TestElementHarness> {
   return query(selector, byTitle(text))
}

export function queryByDisplayValue(text: TextPattern, selector?: string | BaseHarnessFilters): HarnessPredicate<TestElementHarness> {
   return query(selector, byDisplayValue(text))
}

export function queryByAltText(text: TextPattern, selector?: string | BaseHarnessFilters): HarnessPredicate<TestElementHarness> {
   return query(selector, byAltText(text))
}

export function queryBy(options: QueryFilters): HarnessPredicate<TestElementHarness> {
   const predicate = query(options)
   addQueries(predicate, options)
   return predicate
}
