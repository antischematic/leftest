import { afterAll, beforeAll, expect, vi } from "vitest"
import { VitestAdapter } from "./adapter.example"
import { beforeScenario, beforeStep, eq, setAdapter, setTags } from "./core"
import { custom } from "./tags.example"

setAdapter(new VitestAdapter())
setTags("include, ^notThis")

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

beforeAll(() => {
   vi.spyOn(console, "log").mockImplementation(() => {})
})

afterAll(() => {
   ;[
      "before step",
      "runs before",
      "only if custom?",
      "Can run test",
      "test running",
      "hello",
      "inline",
      "example args 1",
      "example args 2",
      123,
      987,
      879,
      789,
      234,
      null,
   ].forEach((match) => {
      expect(console.log).toHaveBeenCalledWith(match)
   })
})

beforeScenario(() => {
   console.log("runs before")
})

beforeScenario(eq(custom), (scenario) => {
   console.log("only if custom?")
   console.log(scenario.name)
})

beforeStep(() => {
   console.log("before step")
})
