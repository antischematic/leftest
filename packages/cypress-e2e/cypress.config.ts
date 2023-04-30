import { defineConfig } from "cypress"

export default defineConfig({
   e2e: {
      supportFile: false,
      specPattern: '**/app.cy.ts',
      testIsolation: false,
   },
})
