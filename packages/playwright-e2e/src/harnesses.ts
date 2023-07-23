import { ComponentHarness, click, selector } from "@antischematic/leftest"

export class RootHarness extends ComponentHarness {
   static hostSelector = "body"

   getStartedButton = this.locatorFor(selector('a', { text: /Get started/i }))

   async getStarted() {
      await click(this.getStartedButton)
   }
}
