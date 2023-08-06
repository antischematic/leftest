import {
   ComponentHarness,
   createTestSuite,
   feature,
   getHandle,
   scenario,
} from "@antischematic/leftest"
import { getHarness } from '@antischematic/leftest-vitest'

class AppHarness extends ComponentHarness {
   static hostSelector = 'main'
}

const steps = {
   'it renders the page': () => {
      document.body.appendChild(document.createElement('main'))
   },
   'it should find the app harness': async () => {
      const app = await getHarness(AppHarness)
      expect(await getHandle(app)).toBeInstanceOf(HTMLElement)
   }
}

const { when, then } = createTestSuite(steps)

feature('Vitest', () => {
   scenario('Test adapter is working', () => {
      when('it renders the page')
      then('it should find the app harness')
   })
})
