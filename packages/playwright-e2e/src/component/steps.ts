import { afterScenario, getHarnessForPage } from "@antischematic/leftest-playwright"
import { expect } from "@playwright/test"
import { createSteps } from "./ct-support"
import { RootHarness } from "../harnesses"

afterScenario(async ({ page }) => {
   await expect(page).toHaveURL(new RegExp(".*intro"))
})

export default createSteps({
   "I visit <url>": async ({ page, mount }, url: string) => {
      await page.goto(url)
   },

   "I click the get started link": async ({ page }) => {
      const harness = await getHarnessForPage(page, RootHarness)
      await harness.getStarted()
   },

   "the url should be <url>": async ({ page }, url: string) => {
      await expect(page).toHaveURL(new RegExp(url))
   },
})
