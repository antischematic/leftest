import {
   ComponentHarness,
   createTestSuite,
   feature,
   scenario,
} from "@antischematic/leftest"
import { getHarness, getNativeElement } from "@antischematic/leftest-vitest"

class AppHarness extends ComponentHarness {
   static hostSelector = 'main'
}

const steps = {
   'it renders the page': () => {
      document.body.appendChild(document.createElement('main'))
   },
   'it should find the app harness': async () => {
      const app = await getHarness(AppHarness)
      const host = await app.host()
      expect(getNativeElement(host)).toBeInstanceOf(HTMLElement)
   }
}

const { when, then } = createTestSuite(steps)

feature('Vitest', () => {
   scenario('Test adapter is working', () => {
      when('it renders the page')
      then('it should find the app harness')
   })
})
