import {
   afterScenario,
   beforeScenario,
   beforeStep,
   eq,
   isExcluded,
   isIncluded,
} from "@antischematic/leftest"
import { getHarness } from "@antischematic/leftest-cypress"
import { custom, include, notThis } from "../fixtures/tags.example"
import { AppHarness } from "../support/app.po"

const app = getHarness(AppHarness)

export default {
   "I run a test": (scenario) => {
      console.log("test running")
   },

   "I run a test with <args> and <hello>": (
      args: string | number,
      hello: unknown,
   ) => {
      console.log(args)
      console.log(hello)
   },

   // "I run a test with <args> and <hi>": () => {},
   // "I run a test with <args> and <yea>": () => {},

   "I explode": () => {
      throw new Error("Boom")
   },

   "I load data": () => {
      cy.window().then(window => {
         return window.fetch('https://jsonplaceholder.cypress.io/todos/1')
            .then(async result => {
               console.log('Successfully fetched https://jsonplaceholder.cypress.io/todos/1', await result.json())
            })
      })
   },

   "I visit <url>": (url: string) => {
      cy.visit(url)
   },

   "I see the greeting <text>": (text) => {
      app.getGreeting().should('eq', text)
   }
}

beforeScenario(() => {
   console.log("runs before")
   cy.log("runs before")
})

beforeScenario(eq(custom), (scenario) => {
   scenario.data.value = "test"
   console.log("only if custom?", scenario.name)
   console.log("scenario data before", scenario.data.value)
   cy.log("scenario data before", scenario.data.value)
})

beforeStep((scenario) => {
   console.log("before step", isIncluded(include), isExcluded(notThis))
   cy.log("before step", isIncluded(include), isExcluded(notThis))
})

afterScenario(eq(custom),(scenario) => {
   console.log("scenario data after", scenario.data.value)
   cy.log("scenario data after", scenario.data.value)
})
