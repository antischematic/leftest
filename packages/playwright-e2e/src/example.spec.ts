import { createSteps, beforeScenario, afterScenario } from "@antischematic/leftest-playwright"
import { expect } from '@playwright/test';
import { createTestSuite, feature, scenario } from "@antischematic/leftest"

afterScenario(async ({ page }) => {
   await expect(page).toHaveURL(/.*intro/)
})

const steps = createSteps({
   async 'I visit <url>'({ page}, url: string) {
      await page.goto(url);
   },

   async 'I click the get started link'({ page}) {
      await page.getByRole('link', { name: 'Get started' }).click();
   },

   async 'The url should be <url>'({ page}, url: RegExp) {
      await expect(page).toHaveURL(url);
   }
})

const { given, when, then } = createTestSuite(steps)

feature('test feature', () => {
   scenario('has title', () => {
      given('I visit "https://playwright.dev/"')
      when('I click the get started link')
      then('The url should be <url>', /.*intro/)
   })
})
