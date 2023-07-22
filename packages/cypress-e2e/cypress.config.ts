import { defineConfig } from "cypress"

export default defineConfig({
   e2e: {
      supportFile: "**/support/e2e.{js,jsx,ts,tsx}",
      specPattern: "**/*.cy.ts",
   },
   env: {
      LEFTEST_TAGS: process.env.TAGS,
   },
})
