import {
   BaseHarnessFilters,
   ComponentHarness,
   HarnessPredicate,
} from "@antischematic/leftest-harness"

export class LinkHarness extends ComponentHarness {
   static hostSelector = "a"

   static with(options: BaseHarnessFilters & { text: string }) {
      return new HarnessPredicate(this, options)
         .addOption('with text', options.text, async (harness, matchText) => {
            const text = await (await harness.host()).text()
            return new RegExp(matchText, 'i').test(text)
         })
   }

   async click() {
      return (await this.host()).click()
   }
}

export class RootHarness extends ComponentHarness {
   static hostSelector = "body"

   getStartedButton = this.locatorFor(LinkHarness.with({ text: 'Get started' }))

   async getStarted() {
      return (await this.getStartedButton()).click()
   }
}
