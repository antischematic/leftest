import { createTestSuite, feature, scenario } from "@antischematic/leftest"
import steps from "./steps"

const { given, when, then } = createTestSuite(steps)

feature('test feature', () => {
   scenario('has title', () => {
      given('I visit "https://playwright.dev/"')
      when('I click the get started link')
      then('the url should be <url>', '.*intro')
   })
})
