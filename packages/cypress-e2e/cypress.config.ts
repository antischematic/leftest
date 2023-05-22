import { defineConfig } from "cypress"

export default defineConfig({
   e2e: {
      supportFile: "**/support/e2e.{js,jsx,ts,tsx}",
      specPattern: "**/app.cy.ts",
      testIsolation: false,
   },
   env: {
      LEFTEST_TAGS: process.env.TAGS,
   },
   // @ts-ignore
   cypressReplay: {
      interceptPattern: ".*/todos/1$",
      responseDelayOverride: 0,
   }
})
