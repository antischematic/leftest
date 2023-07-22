import { createTestSuite, feature, scenario } from "@antischematic/leftest"
import steps from "./steps.example"

const { when, then} = createTestSuite(steps)

feature('Test harness', () => {
   scenario('Can query elements', () => {
      when('I visit "http://cypress.io/"')
      then('I see the greeting <text>', "Test. Automate. Accelerate.")
   })
})
