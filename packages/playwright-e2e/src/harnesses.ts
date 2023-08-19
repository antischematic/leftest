import { ComponentHarness, screen, query, byText } from "@antischematic/leftest"

export class RootHarness extends ComponentHarness {
   static hostSelector = "body"

   getStartedButton = this.locatorFor(query('a', byText(/Get started/i)))

   async getStarted() {
      await screen.click(this.getStartedButton)
   }
}
