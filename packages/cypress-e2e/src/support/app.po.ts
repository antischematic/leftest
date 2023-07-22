import { ComponentHarness, text } from "@antischematic/leftest"

export class AppHarness extends ComponentHarness {
   static hostSelector = "main"

   getGreeting() {
      return text(this.find('h1'))
   }
}
