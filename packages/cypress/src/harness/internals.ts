/* eslint-disable @typescript-eslint/no-explicit-any */
import {
   ComponentHarness,
   TestElementInput,
   UnitTestHarnessEnvironment,
} from "@antischematic/leftest"
import { CypressHarnessEnvironment } from './cypress-harness-environment';

export type ChainableHarness<HARNESS> = Cypress.Chainable<HARNESS> & {
   /* For each field or method... is this a method? */
   [K in keyof HARNESS]: HARNESS[K] extends (...args: any) => any
      ? /* It's a method so let's change the return type. */
      (
         ...args: Parameters<HARNESS[K]>
      ) => /* Convert Promise<T> to Chainable<T> and anything else U to Chainable<U>. */
         ChainableHarness<
            ReturnType<HARNESS[K]> extends Promise<infer RESULT>
               ? RESULT
               : HARNESS[K]
         >
      : /* It's something else. */
      HARNESS[K];
};

async function getNativeElement(handle: TestElementInput): Promise<Element | null> {
      if (handle && "then" in handle && typeof handle.then === 'function') {
         return getNativeElement(await handle)
      } else if (handle instanceof ComponentHarness) {
         return UnitTestHarnessEnvironment.getNativeElement(await handle.host())
      }
      return null
}

/**
 * Adds harness methods to chainer.
 *
 * Given a harness with a `getValue()` method,
 * users can call `getHarness().getValue()`
 * instead of `getHarness().invoke('getValue')`
 */
export function addHarnessMethodsToChainer<HARNESS extends ComponentHarness>(
   chainer: Cypress.Chainable<HARNESS>
): ChainableHarness<HARNESS> {
   const handler = {
      get:
         (chainableTarget: any, prop: string) =>
            (...args: any[]) => {
               /* Don't wrap cypress methods like `invoke`, `should` etc.... */
               if (prop in chainableTarget) {
                  return chainableTarget.then(async (target: any) => {
                     return (Array.isArray(target) ? Promise.all(target.map(t => CypressHarnessEnvironment.getNativeElement(t) ?? t)) : typeof target === "object" ? (await getNativeElement(target)) ?? target : target)
                  })[prop](...args);
               }

               return addHarnessMethodsToChainer(
                  chainableTarget.then((target: any) => target[prop](...args))
               );
            },
   };

   return new Proxy(chainer, handler);
}

export function getDocumentRoot() {
   return cy.get('body', {
      log: false,
   });
}

export function createRootEnvironment(
   $documentRoot: JQuery<Element>
): CypressHarnessEnvironment {
   const documentRoot = $documentRoot.get(0);
   return new CypressHarnessEnvironment(documentRoot, { documentRoot });
}
