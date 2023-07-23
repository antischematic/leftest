import { getHandle } from "@antischematic/leftest"
import {
   afterScenario,
   createSteps,
   getHarness,
   TestFixtures,
} from "@antischematic/leftest-playwright"
import { expect } from "@playwright/test"
import { RootHarness } from "../harnesses"

afterScenario(async ({ page }) => {
   await expect(page).toHaveURL(new RegExp(".*intro"))
})

const steps = {
   "I visit <url>": async ({ page }: TestFixtures, url: string) => {
      await page.goto(url)
   },

   "I click the get started link": async ({ page }: TestFixtures) => {
      const harness = await getHarness(page, RootHarness)
      await expect(await getHandle(harness.getStartedButton)).toBeInViewport()
      await harness.getStarted()
   },

   "the url should be <url>": async ({ page }: TestFixtures, url: string) => {
      await expect(page).toHaveURL(new RegExp(url))
   },
}

export default createSteps(steps)