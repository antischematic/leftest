import {
   ComponentHarness,
   ComponentHarnessConstructor,
   TestElement,
   HarnessEnvironment
} from "@antischematic/leftest"
import { ElementHandle, Locator, Page } from "@playwright/test"
import {isLocator, PlaywrightElement} from './element';

/**
 * @type {WeakMap<import('@angular/cdk/testing').TestElement, import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator>}
 */
const elementHandles = new WeakMap();

/**
 * @internal
 */
export class PlaywrightHarnessEnvironment extends HarnessEnvironment<any> {
   /**
    * @readonly
    * @type {import('@playwright/test').Page}
    */
   #page: Page;

   /**
    * @readonly
    * @type {import('@playwright/test').Locator}
    */
   #documentRoot: Locator;

   /**
    * @readonly
    * @type {Required<import('./abstract-environment.js').PlaywrightHarnessEnvironmentOptions>}
    */
   #opts: any;

   static loader(page: Page) {
      return new PlaywrightHarnessEnvironment(page)
   }

   static harnessForPage<T extends ComponentHarness>(page: Page, harness: ComponentHarnessConstructor<T>) {
      return this.loader(page).getHarness(harness)
   }

   /**
    *
    * @param {import('@playwright/test').Page} page
    * @param {Readonly<import('./abstract-environment.js').PlaywrightHarnessEnvironmentOptions>=} options
    * @param {import('@playwright/test').Locator=} documentRoot
    * @param {import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator=} element
    */
   constructor(
      page: Page,
      {respectShadowBoundaries = false, useLocators = false} = {},
      documentRoot = page.locator(':root'),
      element = documentRoot,
   ) {
      super(element);

      this.#page = page;
      this.#documentRoot = documentRoot;
      this.#opts = {
         respectShadowBoundaries,
         useLocators,
      };
   }

   /**
    * @type {boolean}
    * @override
    */
   get respectShadowBoundaries() {
      return this.#opts.respectShadowBoundaries;
   }

   /**
    * @returns {Promise<void>}
    * @override
    */
   async waitForAngularReady() {
      await Promise.resolve()
      // try {
      //    await this.#page.waitForFunction(isAngularBootstrapped);
      // } catch {
      //    throw new Error(
      //       'Angular failed to bootstrap the application, check whether there are any errors in the console when you open the application',
      //    );
      // }
      //
      // await this.forceStabilize();
   }

   /**
    * @returns {Promise<void>}
    * @override
    */
   async forceStabilize() {
      // await this.#page.evaluate(waitUntilAngularStable);
      await Promise.resolve()
   }

   /**
    * @returns {Promise<void>}
    * @override
    */
   async waitForTasksOutsideAngular() {
      // await this.#page.evaluate(waitUntilRootZoneStable);
      await Promise.resolve()
   }

   /**
    * @param {import('@angular/cdk/testing').TestElement} element
    * @returns {Promise<import('@playwright/test').ElementHandle<HTMLElement | SVGElement>>}
    * @override
    */
   async getPlaywrightHandle(element: TestElement) {
      const handleOrLocator = elementHandles.get(element);

      if (handleOrLocator == null) {
         throw new Error(
            'The given TestElement was not created by PlaywrightHarnessEnvironment',
         );
      }

      if (isLocator(handleOrLocator)) {
         // Only one case where we are passed a Locator: the root element of the page, which is always
         // present -> we can safely ignore the null return type
         return /** @type {import('@playwright/test').ElementHandle<HTMLElement | SVGElement>} */ (
            await handleOrLocator.elementHandle()
         );
      } else {
         return handleOrLocator;
      }
   }

   /**
    * @param {import('@angular/cdk/testing').TestElement} element
    * @returns {import('@playwright/test').Locator}
    * @override
    */
   getPlaywrightLocator(element: TestElement) {
      const handleOrLocator = elementHandles.get(element);

      if (handleOrLocator == null) {
         throw new Error(
            'The given TestElement was not created by PlaywrightHarnessEnvironment',
         );
      }

      if (!isLocator(handleOrLocator)) {
         throw new Error(
            'This PlaywrightHarnessEnvironment is not configured to use locators',
         );
      }

      return handleOrLocator;
   }

   /**
    * @param {import('./abstract-environment.js').PlaywrightHarnessEnvironmentOptions} options
    * @returns {PlaywrightHarnessEnvironment}
    * @override
    */
   withOptions(options: any) {
      return new PlaywrightHarnessEnvironment(
         this.#page,
         {
            ...this.#opts,
            ...options,
         },
         this.#documentRoot,
         this.rawRootElement,
      );
   }

   /**
    *
    * @returns {import('@playwright/test').Locator}
    * @override
    * @protected
    */
   getDocumentRoot() {
      return this.#documentRoot;
   }

   /**
    * @param {import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator} handle
    * @returns {import('@angular/cdk/testing').TestElement}
    * @override
    * @protected
    */
   createTestElement(handle: ElementHandle<HTMLElement | SVGElement> | Locator): TestElement {
      // This function is called in the HarnessEnvironment constructor, so we
      // can't directly use private properties here due to the polyfill in tslib
      const element = new PlaywrightElement(
         () => this.#page,
         handle,
         async () => {
            // if (shouldStabilizeAutomatically()) {
            //    await this.forceStabilize();
            // }
         },
      );

      elementHandles.set(element, handle);

      return element;
   }

   /**
    * @param {import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator} element
    * @returns {PlaywrightHarnessEnvironment}
    * @override
    * @protected
    */
   createEnvironment(element: any) {
      return new PlaywrightHarnessEnvironment(
         this.#page,
         this.#opts,
         this.#documentRoot,
         element,
      );
   }

   /**
    * @param {string} selector
    * @returns {Promise<(import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator)[]>}
    * @override
    * @protected
    */
   async getAllRawElements(selector: string) {
      if (!isLocator(this.rawRootElement)) {
         return await this.rawRootElement.$$(
            this.respectShadowBoundaries
               ? `css:light=${selector}`
               : `css=${selector}`,
         );
      } else {
         const locator = this.rawRootElement.locator(
            this.respectShadowBoundaries
               ? `css:light=${selector}`
               : `css=${selector}`,
         );

         if (this.#opts.useLocators) {
            return Array.from({length: await locator.count()}, (_, i) =>
               locator.nth(i),
            );
         }

         return /** @type {import('@playwright/test').ElementHandle<HTMLElement | SVGElement>[]} */ (
            await locator.elementHandles()
         );
      }
   }
}

export function getHarness<T extends ComponentHarness>(page: Page, harness: ComponentHarnessConstructor<T>) {
   return PlaywrightHarnessEnvironment.harnessForPage(page, harness)
}
