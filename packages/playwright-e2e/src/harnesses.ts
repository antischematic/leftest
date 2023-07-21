import { ComponentHarness, click } from "@antischematic/leftest"

export class RootHarness extends ComponentHarness {
   static hostSelector = "body"

   async getStarted() {
      await click(this.query('a', { text: /Get started/i }))
   }
}
