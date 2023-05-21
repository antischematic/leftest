import { beforeScenario, beforeStep, eq, isExcluded, isIncluded } from "@antischematic/leftest"
import { custom, include, notThis } from "../fixtures/tags.example"

export default {
   "I run a test": () => {
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
}

beforeScenario(() => {
   console.log("runs before")
})

beforeScenario(eq(custom), (scenario) => {
   console.log("only if custom?")
   console.log(scenario.name)
})

beforeStep(() => {
   console.log("before step", isIncluded(include), isExcluded(notThis))
})
