import { PlaywrightHarnessEnvironment } from "@antischematic/leftest-harness/playwright"
import { afterScenario, createSteps } from "@antischematic/leftest-playwright"
import { expect } from "@playwright/test"
import { RootHarness } from "./harnesses"

afterScenario(async ({ page }) => {
   await expect(page).toHaveURL(/.*intro/)
})

export default createSteps({
   'I visit <url>': async ({ page}, url: string) => {
      await page.goto(url);
   },

   'I click the get started link': async ({ page}) => {
      const loader = PlaywrightHarnessEnvironment.loader(page)
      const harness = await loader.getHarness(RootHarness)
      await harness.getStarted();
   },

   'The url should be <url>': async ({ page}, url: RegExp) => {
      await expect(page).toHaveURL(url);
   }
})
