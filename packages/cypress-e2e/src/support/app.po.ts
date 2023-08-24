import { ComponentHarness, selector, screen, query } from "@antischematic/leftest"

export class AppHarness extends ComponentHarness {
   static hostSelector = selector("main")

   greeting = this.locatorFor(query('h1'))

   getGreetingText() {
      return screen.text(this.greeting())
   }

   getParagraphs = this.locatorForAll('p')
}
