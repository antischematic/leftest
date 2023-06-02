import {
   afterScenario,
   beforeScenario,
   beforeStep,
   eq,
   isExcluded,
   isIncluded,
} from "@antischematic/leftest"
import { custom, include, notThis } from "../fixtures/tags.example"

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
      })
   }
}

beforeScenario(() => {
   console.log("runs before")
})

beforeScenario(eq(custom), (scenario) => {
   scenario.data.value = "test"
   console.log("only if custom?", scenario.name)
   console.log("scenario data before", scenario.data.value)
})

beforeStep((scenario) => {
   console.log("before step", isIncluded(include), isExcluded(notThis))
})

afterScenario(eq(custom),(scenario) => {
   console.log("scenario data after", scenario.data.value)
})
