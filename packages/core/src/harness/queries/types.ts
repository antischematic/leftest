import type { ContentContainerComponentHarness } from "../component-harness"
import { BaseHarnessFilters } from "../harness-predicate"
import type { TestElement } from "../test-element"
import { AriaFilters } from "./by-aria"
import { TextPattern } from "./by-text"

export interface TestElementHarness extends ContentContainerComponentHarness, TestElement {}

export interface QueryFilters extends BaseHarnessFilters, AriaFilters {
   altText?: TextPattern
   displayValue?: TextPattern
   labelText?: TextPattern
   placeholderText?: TextPattern
   text?: TextPattern
}
