import { ComponentHarness, selector, text } from "@antischematic/leftest"

export class AppHarness extends ComponentHarness {
   static hostSelector = "main"

   greeting = this.locatorFor(selector('h1'))

   getGreetingText() {
      return text(this.greeting)
   }
}
