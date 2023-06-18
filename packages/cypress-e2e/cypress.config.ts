import { defineConfig } from "cypress"
import { setupPollyTasks } from "./src/support/polly-tasks"

export default defineConfig({
   e2e: {
      supportFile: "**/support/e2e.{js,jsx,ts,tsx}",
      specPattern: "**/app.cy.ts",
      testIsolation: false,
      setupNodeEvents(on) {
         setupPollyTasks(on)
      }
   },
   env: {
      LEFTEST_TAGS: process.env.TAGS,
   },
})
