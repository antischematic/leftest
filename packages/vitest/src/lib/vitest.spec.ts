import {
   ContentContainerComponentHarness,
   createTestSuite,
   feature,
   scenario,
} from "@antischematic/leftest"
import { getHarness, getHarnessOrNull, getNativeElement } from "@antischematic/leftest-vitest"

class AppHarness extends ContentContainerComponentHarness {
   static hostSelector = 'main'
}

const steps = {
   'it renders the page': () => {
      setTimeout(() => {
         document.body.innerHTML = '<main><p>Hello</p></main>'
      }, 1000)
   },
   'it should find the app harness': async () => {
      const app = await getHarness(AppHarness, { wait: 1000, count: 1 })
      expect(getNativeElement(app)).toBeInstanceOf(HTMLElement)
   },
   'it unloads the page': () => {
      setTimeout(() => {
         document.body.innerHTML = ''
      }, 1000)
   },
   'it should not find the message': async () => {
      const app = await getHarnessOrNull(AppHarness, { wait: true, count: 0 })

      expect(app).toBeNull()
   },
}

const { when, then } = createTestSuite(steps)

feature('Vitest', () => {
   scenario('Test adapter is working', () => {
      when('it renders the page')
      then('it should find the app harness')
      when('it unloads the page')
      then('it should not find the message')
   })
})
