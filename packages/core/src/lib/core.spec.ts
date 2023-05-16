// noinspection BadExpressionStatementJS

import { createTestSuite, background, feature, scenario } from "./core"
import { custom, include, notThis } from "./tags.example"
import steps from "./steps.example"

const { given, when, then, examples } = createTestSuite(steps)

feature("Test feature", () => {
   background(() => {
      given("I run a test")
   })

   ~include
   ~notThis
   scenario("Explodes", () => {
      given("I explode")
   })

   ~custom
   ~include
   scenario("Can run test", () => {
      when("I run a test with <args> and <hello>", "hello", 13)
   })

   scenario("Can run a test with examples", () => {
      given('I run a test with "inline" and [null]')
      when("I run a test with <args> and <hello>")
      when("I run a test with <args> and <renamed>")
      then("I run a test with [123] and [456]")
      then("I run a test with <args> and <hello>", 987, 879)
      then("I run a test with <args> and <hello>", 987, 879)

      ~notThis
      examples([
         { args: "example args 1", hello: 234 },
         { args: "example args 2", hello: 789 },
      ])

      ~include
      examples([
         { args: "example args 1", renamed: 234, hello: 0 },
         { args: "example args 2", hello: 789, renamed: 0 },
      ])
   })
})
