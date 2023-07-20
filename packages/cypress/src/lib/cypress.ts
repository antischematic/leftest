import {
   Flag,
   setAdapter,
   setTags,
   TestSuiteAdapter,
   TestSuiteAdapterMetadata,
} from "@antischematic/leftest"

export class CypressTestSuiteAdapter implements TestSuiteAdapter {
   isAsync = false

   suite(name: string, impl: () => void, flag: Flag): void {
      switch (flag) {
         case Flag.SKIP:
            describe.skip(name, impl)
            break
         case Flag.ONLY:
            describe.only(name, impl)
            break
         case Flag.DEFAULT:
            describe(name, impl)
      }
   }

   test(name: string, impl: () => void, { flag }: TestSuiteAdapterMetadata): void {
      switch (flag) {
         case Flag.SKIP:
            it.skip(name, () => impl())
            break
         case Flag.ONLY:
            it.only(name, () => impl())
            break
         case Flag.DEFAULT:
            it(name, () => impl())
      }
   }

   step(name: string, description: string, impl: () => void): void {
      cy.step(name, description, impl)
   }

   beforeScenario(impl: () => void): void {
      cy.beforeScenario(impl)
   }

   beforeStep(impl: () => void): void {
      cy.beforeStep(impl)
   }

   afterScenario(impl: () => void): void {
      cy.afterScenario(impl)
   }

   afterStep(impl: () => void): void {
      cy.afterStep(impl)
   }
}

declare global {
   namespace Cypress {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      interface Chainable<Subject> {
         step(name: string, description: string, impl: () => void): void
         beforeScenario(impl: () => void): void
         afterScenario(impl: () => void): void
         beforeStep(impl: () => void): void
         afterStep(impl: () => void): void
      }
   }
}

function collapseLastGroup() {
   const openExpanders = window.top!.document.getElementsByClassName(
      'command-expander-is-open',
   )
   const numExpanders = openExpanders.length
   const el = openExpanders[numExpanders - 1]

   if (el) el.parentElement!.click()
}

Cypress.Commands.add('step', (name: string, description, impl) => {
   Cypress.log({
      name,
      message: description,
      type: 'parent',
      groupStart: true
   } as any)
   cy.then(impl)
   cy.then(() => {
      collapseLastGroup()
      Cypress.log({
         groupEnd: true,
         emitOnly: true
      } as any)
   })
})

const hooks = [['beforeScenario', 'Before Scenario'], ['beforeStep', 'Before Step'], ['afterScenario', 'After Scenario'], ['afterStep', 'After Step']] as const

for (const [hook, name] of hooks) {
   Cypress.Commands.add(hook, (impl) => {
      Cypress.log({
         name,
         message: '',
         type: 'parent',
         groupStart: true
      } as any)
      cy.then(impl)
      cy.then(() => {
         collapseLastGroup()
         Cypress.log({
            groupEnd: true,
            emitOnly: true
         } as any)
      })
   })
}

setAdapter(new CypressTestSuiteAdapter())
setTags(Cypress.env("LEFTEST_TAGS") ?? "")
