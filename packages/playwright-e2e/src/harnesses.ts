import { ComponentHarness, click, element } from "@antischematic/leftest"

export class RootHarness extends ComponentHarness {
   static hostSelector = "body"

   getStartedButton = this.locatorFor(element('a', { text: /Get started/i }))

   async getStarted() {
      await click(this.getStartedButton)
   }
}
