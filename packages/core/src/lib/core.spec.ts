import { createTestSuite } from "./core"
import { afterAll, expect, beforeAll, vi } from "vitest"
import steps from "./steps.example"

const { feature, scenario, given, when, then, examples, background } =
   createTestSuite(steps)

feature("Test feature", () => {
   beforeAll(() => {
      vi.spyOn(console, "log").mockImplementation(() => {})
   })

   background(() => {
      given("I run a test")
   })

   scenario("Can run test", () => {
      when("I run a test with <args> and <hello>", "hello", 13)
   })

   scenario("Can run a test with examples", () => {
      given('I run a test with "inline" and [null]')
      when("I run a test with <args> and <hello>")
      then("I run a test with [123] and [456]")
      then("I run a test with <args> and <hello>", 987, 879)

      examples([
         { args: "example args 1", hello: 234 },
         { args: "example args 2", hello: 789 },
      ])
   })
})

afterAll(() => {
   ;[
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
