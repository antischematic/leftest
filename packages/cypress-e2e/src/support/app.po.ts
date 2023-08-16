import { ComponentHarness, element, selector, text } from "@antischematic/leftest"

export class AppHarness extends ComponentHarness {
   static hostSelector = selector("main")

   greeting = this.locatorFor(element('h1'))

   getGreetingText() {
      return text(this.greeting)
   }

   getParagraphs = this.locatorForAll('p')
}
