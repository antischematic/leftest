import { ComponentHarness, methodNames } from "./component-harness"
import { ElementDimensions } from "./element-dimensions"
import {
   EventData,
   ModifierKeys,
   TestElement,
   TestKey,
   TextOptions,
} from "./test-element"

export type TestElementInput =
   | ComponentHarness
   | TestElement
   | Promise<ComponentHarness | TestElement>
   | undefined
   | null
   | Promise<void>
   | Promise<null>
   | (() => TestElementInput)

type NullInput = null | undefined | Promise<null> | Promise<undefined> | (() => NullInput)

export type TestElementOutput<T extends TestElementInput, U> = T extends NullInput ? Promise<null> : Promise<U>

export interface Screen {
   /** Blur the element. */
   blur(element: TestElementInput): Promise<void>

   /** Clear the element's input (for input and textarea elements only). */
   clear(element: TestElementInput): Promise<void>

   /**
    * Click the element at the default location for the current environment. If you need to guarantee
    * the element is clicked at a specific location, consider using `click('center')` or
    * `click(x, y)` instead.
    */
   click(element: TestElementInput, modifiers?: ModifierKeys): Promise<void>

   /** Click the element at the element's center. */
   click(
      element: TestElementInput,
      location: "center",
      modifiers?: ModifierKeys,
   ): Promise<void>

   /**
    * Click the element at the specified coordinates relative to the top-left of the element.
    * @param element TestElement instance
    * @param relativeX Coordinate within the element, along the X-axis at which to click.
    * @param relativeY Coordinate within the element, along the Y-axis at which to click.
    * @param modifiers Modifier keys held while clicking
    */
   click(
      element: TestElementInput,
      relativeX: number,
      relativeY: number,
      modifiers?: ModifierKeys,
   ): Promise<void>

   /**
    * Right clicks on the element at the specified coordinates relative to the top-left of it.
    * @param element TestElement instance
    * @param relativeX Coordinate within the element, along the X-axis at which to click.
    * @param relativeY Coordinate within the element, along the Y-axis at which to click.
    * @param modifiers Modifier keys held while clicking
    */
   rightClick(
      element: TestElementInput,
      relativeX: number,
      relativeY: number,
      modifiers?: ModifierKeys,
   ): Promise<void>

   /** Focus the element. */
   focus(element: TestElementInput): Promise<void>

   /** Get the computed value of the given CSS property for the element. */
   getCssValue<T extends TestElementInput>(element: T, property: string): TestElementOutput<T, string>

   /** Hovers the mouse over the element. */
   hover(element: TestElementInput): Promise<void>

   /** Moves the mouse away from the element. */
   mouseAway(element: TestElementInput): Promise<void>

   /**
    * Sends the given string to the input as a series of key presses. Also fires input events
    * and attempts to add the string to the Element's value. Note that some environments cannot
    * reproduce native browser behavior for keyboard shortcuts such as Tab, Ctrl + A, etc.
    * @throws An error if no keys have been specified.
    */
   sendKeys(
      element: TestElementInput,
      ...keys: (string | TestKey)[]
   ): Promise<void>

   /**
    * Sends the given string to the input as a series of key presses. Also fires input
    * events and attempts to add the string to the Element's value.
    * @throws An error if no keys have been specified.
    */
   sendKeys(
      element: TestElementInput,
      modifiers: ModifierKeys,
      ...keys: (string | TestKey)[]
   ): Promise<void>

   /**
    * Gets the text from the element.
    * @param element TestElement instance
    * @param options Options that affect what text is included.
    */
   text<T extends TestElementInput>(element: T, options?: TextOptions): TestElementOutput<T, string>

   /**
    * Sets the value of a `contenteditable` element.
    * @param element TestElement instance
    * @param value Value to be set on the element.
    * @breaking-change 16.0.0 Will become a required method.
    */
   setContenteditableValue?(
      element: TestElementInput,
      value: string,
   ): Promise<void>

   /** Gets the value for the given attribute from the element. */
   getAttribute<T extends TestElementInput>(element: T, name: string): TestElementOutput<T, string | null>

   /** Checks whether the element has the given class. */
   hasClass<T extends TestElementInput>(element: T, name: string): TestElementOutput<T, boolean>

   /** Gets the dimensions of the element. */
   getDimensions(): Promise<ElementDimensions>

   /** Gets the value of a property of an element. */
   getProperty<T = any>(element: TestElementInput, name: string): Promise<T>

   /** Checks whether this element matches the given selector. */
   matchesSelector<T extends TestElementInput>(
      element: TestElementInput,
      selector: string,
   ): TestElementOutput<T, boolean>

   /** Checks whether the element is focused. */
   isFocused<T extends TestElementInput>(element: TestElementInput): TestElementOutput<T, boolean>

   /** Sets the value of a property of an input. */
   setInputValue(element: TestElementInput, value: string): Promise<void>

   // Note that ideally here we'd be selecting options based on their value, rather than their
   // index, but we're limited by `@angular/forms` which will modify the option value in some cases.
   // Since the value will be truncated, we can't rely on it to do the lookup in the DOM. See:
   // https://github.com/angular/angular/blob/main/packages/forms/src/directives/select_control_value_accessor.ts#L19
   /** Selects the options at the specified indexes inside of a native `select` element. */
   selectOptions(element: TestElementInput, ...optionIndexes: number[]): Promise<void>

   /**
    * Dispatches an event with a particular name.
    * @param element
    * @param name Name of the event to be dispatched.
    * @param data
    */
   dispatchEvent(element: TestElementInput, name: string, data?: Record<string, EventData>): Promise<void>

   getHandle<T = any>(element: TestElementInput): Promise<T>
}

export const screen: Screen = Array.from(methodNames).reduce((acc, method) => {
   acc[method] = async (handle: TestElementInput, ...args: any[]) => {
      const d: any = screen
      const h: any = handle
      if (typeof handle === "function") {
         return d[method](handle(), ...args)
      } else if (handle && "then" in handle) {
         return handle.then((result) => d[method](result, ...args))
      } else if (handle && "host" in handle) {
         return d[method](handle.host(), ...args)
      } else {
         return h?.[method]?.(...args) ?? null
      }
   }
   return acc
}, {} as any)
