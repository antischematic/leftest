// noinspection BadExpressionStatementJS

import { todo, createTestSuite } from "@antischematic/leftest-cypress"
import steps from "./steps.example"

const { feature, scenario, given, when, then, examples, background } =
   createTestSuite(steps)

feature("Test feature", () => {
   background(() => {
      given("I run a test")
   })

   ~todo
   scenario("Can run test", () => {
      when("I run a test with <args> and <hello>", "hello", 13)
   })

   scenario("Can run a test with examples", () => {
      given('I run a test with "inline" and [123]')
      when("I run a test with <args> and <hello>")
      then("I run a test with [123] and [456]")
      then("I run a test with <args> and <hello>", 987, 879)

      examples([
         { args: "example args 1", hello: 234 },
         { args: "example args 2", hello: 789 },
      ])
   })
})
