import { EventData, ModifierKeys, TestKey, TextOptions } from "@antischematic/leftest-harness"
import { ElementHandle, Locator, Page } from "@playwright/test"

/** @typedef {import('@angular/cdk/testing').ElementDimensions} ElementDimensions */
/** @typedef {import('@angular/cdk/testing').EventData} EventData */
/** @typedef {import('@angular/cdk/testing').ModifierKeys} ModifierKeys */
/** @typedef {import('@angular/cdk/testing').TestElement} TestElement */
/** @typedef {import('@angular/cdk/testing').TextOptions} TextOptions */
/** @template [T=Node] @typedef {import('@playwright/test').ElementHandle<T>} ElementHandle */
/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

import * as contentScripts from './browser';

/**
 * @type {Map<TestKey, string>}
 */
const keyMap = new Map([
   [TestKey.ALT, 'Alt'],
   [TestKey.BACKSPACE, 'Backspace'],
   [TestKey.CONTROL, 'Control'],
   [TestKey.DELETE, 'Delete'],
   [TestKey.DOWN_ARROW, 'ArrowDown'],
   [TestKey.END, 'End'],
   [TestKey.ENTER, 'Enter'],
   [TestKey.ESCAPE, 'Escape'],
   [TestKey.F1, 'F1'],
   [TestKey.F2, 'F2'],
   [TestKey.F3, 'F3'],
   [TestKey.F4, 'F4'],
   [TestKey.F5, 'F5'],
   [TestKey.F6, 'F6'],
   [TestKey.F7, 'F7'],
   [TestKey.F8, 'F8'],
   [TestKey.F9, 'F9'],
   [TestKey.F10, 'F10'],
   [TestKey.F11, 'F11'],
   [TestKey.F12, 'F12'],
   [TestKey.HOME, 'Home'],
   [TestKey.INSERT, 'Insert'],
   [TestKey.LEFT_ARROW, 'ArrowLeft'],
   [TestKey.META, 'Meta'],
   [TestKey.PAGE_DOWN, 'PageDown'],
   [TestKey.PAGE_UP, 'PageUp'],
   [TestKey.RIGHT_ARROW, 'ArrowRight'],
   [TestKey.SHIFT, 'Shift'],
   [TestKey.TAB, 'Tab'],
   [TestKey.UP_ARROW, 'ArrowUp'],
]);

const modifierMapping = /** @type {const} */ ([
   ['alt', 'Alt'],
   ['shift', 'Shift'],
   ['meta', 'Meta'],
   ['control', 'Control'],
]) as const;

/**
 * @param {ModifierKeys} modifiers
 */
function getModifiers(modifiers: ModifierKeys) {
   return modifierMapping
      .filter(([modifier]) => modifiers[modifier])
      .map(([, modifier]) => modifier);
}

/**
 * @param {(string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]} keys
 * @returns {keys is [ModifierKeys, ...(string | TestKey)[]]}
 */
function hasModifiers(keys: [ModifierKeys, ...(string | TestKey)[]]) {
   return typeof keys[0] === 'object';
}

/**
 * @template {unknown[]} T
 * @param {T} args
 * @returns {args is T & ['center', ...unknown[]]}
 */
function isCenterClick(args: ClickParameters) {
   return args[0] === 'center';
}

/**
 * @param {ClickParameters} args
 * @returns {args is [number, number, ModifierKeys?]}
 */
function isPositionedClick(args: ClickParameters) {
   return typeof args[0] === 'number';
}

/**
 * @typedef {[ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?]} ClickParameters
 */

type ClickParameters = [ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?]

/**
 *
 * @param {ElementHandle<unknown> | Locator} handleOrLocator
 * @returns {handleOrLocator is Locator}
 */
export function isLocator(handleOrLocator: ElementHandle<unknown> | Locator) {
   return !('$$' in handleOrLocator);
}

/**
 * `TestElement` implementation backed by playwright's `ElementHandle`
 *
 * @internal
 * @implements TestElement
 */
export class PlaywrightElement {
   /**
    * The page the element is on
    *
    * @readonly
    * @type {() => Page}
    */
   #page: () => Page;

   /**
    * Awaits for the angular app to become stable
    *
    * This function has to be called after every manipulation and before any query
    *
    * @readonly
    * @type {<T>(fn: (handle: Locator | ElementHandle<HTMLElement | SVGElement>) => Promise<T>) => Promise<T>}
    */
   #query: <T>(fn: (handle: Locator | ElementHandle<HTMLElement | SVGElement>) => Promise<T>) => Promise<T>;

   /**
    * Awaits for the angular app to become stable
    *
    * This function has to be called after every manipulation and before any query
    *
    * @readonly
    * @type {(fn: (handle: Locator | ElementHandle<HTMLElement | SVGElement>) => Promise<void>) => Promise<void>}
    */
   #perform: (fn: (handle: Locator | ElementHandle<HTMLElement | SVGElement>) => Promise<void>) => Promise<void>;

   /**
    * Execute the given script
    *
    * @readonly
    * @type {Locator['evaluate']}
    */
   #evaluate: Locator['evaluate'];

   /**
    * @param {() => Page} page
    * @param {ElementHandle<HTMLElement | SVGElement> | Locator} handleOrLocator
    * @param {() => Promise<void>} whenStable
    */
   constructor(page: () => Page, handleOrLocator: ElementHandle<HTMLElement | SVGElement> | Locator, whenStable: () => Promise<void>) {
      this.#page = page;

      this.#query = async (fn: any) => {
         await whenStable();
         return fn(handleOrLocator);
      };

      this.#perform = async (fn: any) => {
         try {
            return await fn(handleOrLocator);
         } finally {
            await whenStable();
         }
      };

      this.#evaluate = /** @type {Locator} */ (handleOrLocator).evaluate.bind(
         handleOrLocator,
      );
   }

   /**
    *
    * @param  {ClickParameters} args
    * @returns {Promise<Parameters<ElementHandle['click']>[0]>}
    */
   #toClickOptions = async (...args: ClickParameters) => {
      /** @type {Parameters<ElementHandle['click']>[0]} */
      const clickOptions = {} as any;
      /** @type {ModifierKeys | undefined} */
      let modifierKeys;

      if (isCenterClick(args)) {
         const size = await this.getDimensions();

         clickOptions.position = {
            x: size.width / 2,
            y: size.height / 2,
         };

         modifierKeys = args[1];
      } else if (isPositionedClick(args as any)) {
         clickOptions.position = {x: args[0], y: args[1]};
         modifierKeys = args[2];
      } else {
         modifierKeys = args[0];
      }

      if (modifierKeys) {
         clickOptions.modifiers = getModifiers(modifierKeys as any);
      }

      return clickOptions;
   };

   /**
    * @returns {Promise<void>}
    */
   blur() {
      // Playwright exposes a `focus` function but no `blur` function, so we have
      // to resort to executing a function ourselves.
      return this.#perform(() => this.#evaluate(contentScripts.blur));
   }

   /**
    * @returns {Promise<void>}
    */
   clear() {
      return this.#perform(handle => handle.fill(''));
   }

   /**
    * @param {ClickParameters} args
    * @returns {Promise<void>}
    */
   click(...args: ClickParameters) {
      return this.#perform(async handle =>
         handle.click(await this.#toClickOptions(...args)),
      );
   }

   /**
    * @param {ClickParameters} args
    * @returns {Promise<void>}
    */
   rightClick(...args: ClickParameters) {
      return this.#perform(async handle =>
         handle.click({
            ...(await this.#toClickOptions(...args)),
            button: 'right',
         }),
      );
   }

   /**
    * @param {string} name
    * @param {Record<string, EventData>=} data
    * @returns {Promise<void>}
    */
   dispatchEvent(name: string, data: Record<string, EventData>) {
      // ElementHandle#dispatchEvent executes the equivalent of
      //   `element.dispatchEvent(new CustomEvent(name, {detail: data}))`
      // which doesn't match what angular wants: `data` are properties to be
      // placed on the event directly rather than on the `details` property

      return this.#perform(() =>
         // Cast to `any` needed because of infinite type instantiation
         this.#evaluate(
            contentScripts.dispatchEvent as any,
            /** @type {[string, any]} */ ([name, data]),
         ),
      );
   }

   /**
    * @returns {Promise<void>}
    */
   focus() {
      return this.#perform(handle => handle.focus());
   }

   /**
    * @param {string} property
    * @returns {Promise<string>}
    */
   async getCssValue(property: string): Promise<string> {
      return this.#query(() =>
         this.#evaluate(contentScripts.getStyleProperty, property),
      );
   }

   /**
    * @returns {Promise<void>}
    */
   async hover() {
      return this.#perform(handle => handle.hover());
   }

   /**
    * @returns {Promise<void>}
    */
   async mouseAway() {
      const {left, top} = await this.#query(async (handle: any) => {
         let {left, top} = await this.#evaluate(
            contentScripts.getBoundingClientRect,
         );

         if (left < 0 && top < 0) {
            await handle.scrollIntoViewIfNeeded();
            ({left, top} = await this.#evaluate(
               contentScripts.getBoundingClientRect,
            ));
         }

         return {left, top};
      });

      return this.#perform(() =>
         this.#page().mouse.move(Math.max(0, left - 1), Math.max(0, top - 1)),
      );
   }

   /**
    *
    * @param  {...number} optionIndexes
    * @returns {Promise<void>}
    */
   selectOptions(...optionIndexes: number[]) {
      // ElementHandle#selectOption supports selecting multiple options at once,
      // but that triggers only one change event.
      // So we select options as if we're a user: one at a time

      return this.#perform(async handle => {
         /** @type {{index: number}[]} */
         const selections = [];
         for (const index of optionIndexes) {
            selections.push({index});
            await handle.selectOption(selections);
         }
      });
   }

   /**
    *
    * @param  {(string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]} input
    * @returns {Promise<void>}
    */
   sendKeys(...input: (string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]) {
      return this.#perform(async handle => {
         /** @type {string | undefined} */
         let modifiers;
         let keys;
         if (hasModifiers(input as any)) {
            /** @type {ModifierKeys} */
            let modifiersObject;
            [modifiersObject, ...keys] = input;

            modifiers = getModifiers(modifiersObject as any).join('+');
         } else {
            keys = input;
         }

         if (!keys.some(key => key !== '')) {
            // throw getNoKeysSpecifiedError();
            throw new Error('No keys specified')
         }

         await handle.focus();

         const {keyboard} = this.#page();

         if (modifiers) {
            await keyboard.down(modifiers);
         }

         try {
            for (const key of /** @type {(string | TestKey)[]} */ (keys)) {
               if (typeof key === 'string') {
                  await keyboard.type(key);
               } else if (keyMap.has(key as any)) {
                  await keyboard.press(/** @type {string} */ (keyMap.get(key as any)) as any);
               } else {
                  throw new Error(`Unknown key: ${TestKey[key as any] ?? key}`);
               }
            }
         } finally {
            if (modifiers) {
               await keyboard.up(modifiers);
            }
         }
      });
   }

   /**
    * @param {string} value
    * @returns {Promise<void>}
    */
   setInputValue(value: string) {
      return this.#perform(handle => handle.fill(value));
   }

   /**
    * @param {TextOptions=} options
    * @returns {Promise<string>}
    */
   text(options: TextOptions) {
      return this.#query(handle => {
         if (options?.exclude) {
            return this.#evaluate(
               contentScripts.getTextWithExcludedElements,
               options.exclude,
            );
         }

         return handle.innerText();
      });
   }

   /**
    * @param {string} value
    * @returns {Promise<void>}
    */
   setContenteditableValue(value: string) {
      return this.#perform(() =>
         this.#evaluate(contentScripts.setContenteditableValue, value),
      );
   }

   /**
    * @param {string} name
    * @returns {Promise<string | null>}
    */
   getAttribute(name: string) {
      return this.#query(handle => handle.getAttribute(name));
   }

   /**
    * @param {string} name
    * @returns {Promise<boolean>}
    */
   async hasClass(name: string) {
      const classes =
         (await this.#query(handle => handle.getAttribute('class')))?.split(
            /\s+/,
         ) ?? [];

      return classes.includes(name);
   }

   /**
    * @returns {Promise<ElementDimensions>}
    */
   async getDimensions() {
      return this.#query(() =>
         this.#evaluate(contentScripts.getBoundingClientRect),
      );
   }

   /**
    * @param {string} name
    * @returns {Promise<any>}
    */
   async getProperty(name: string) {
      const property = await this.#query(async (handle: any) => {
         if (isLocator(handle)) {
            return handle.evaluateHandle(contentScripts.getProperty, name);
         } else {
            return handle.getProperty(name);
         }
      });

      try {
         return await property.jsonValue();
      } finally {
         await property.dispose();
      }
   }

   /**
    * @param {string} selector
    * @returns {Promise<boolean>}
    */
   async matchesSelector(selector: string) {
      return this.#query(() => this.#evaluate(contentScripts.matches, selector));
   }

   /**
    * @returns {Promise<boolean>}
    */
   async isFocused() {
      return this.matchesSelector(':focus');
   }
}
