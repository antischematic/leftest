// noinspection BadExpressionStatementJS

import {
   background,
   beforeScenario,
   createTestSuite,
   feature, only,
   scenario,
   skip,
} from "@antischematic/leftest"
import { custom, include, notThis } from "../fixtures/tags.example"
import steps from "./steps.example"

const { given, when, then, and, examples } = createTestSuite(steps)

beforeScenario(() => {
   cy.visit("http://example.com")
})

feature("Test feature", () => {
   background(() => {
      given("I run a test")
      and("I load data")
      and("I load data")
   })

   ~include
   ~notThis
   scenario("Explodes", () => {
      given("I explode")
   })

   ~skip
   ~include
   scenario("Skipped", () => {
      given("I explode")
   })

   scenario("Stops after error", () => {
      given("I explode")
      when("I run a test with <args> and <hello>", "hello", 1)
      when("I run a test with <args> and <hello>", "hello", 2)
      when("I run a test with <args> and <hello>", "hello", 3)
   })

   ~custom
   ~include
   scenario("Can run test", () => {
      when("I run a test with <args> and <hello>", "hello", 13)
   })

   scenario("Can run a test with examples", () => {
      given('I run a test with "inline" and [123]')
      when("I run a test with <args> and <hello>")
      when("I run a test with <args> and <hello>")
      then("I run a test with [123] and [456]")
      then("I run a test with <args> and <hello>", 987, 879)
      then("I run a test with <args> and <hello>", 987, 879)

      // ~notThis
      // examples('First group',[
      //    { args: "example args 1", hello: 234 },
      //    { args: "example args 2", hello: 789 },
      // ])

      ~include
      examples('Second group', [
         { args: "example args 1", renamed: 234, hello: 0 },
         { args: "example args 2", hello: 789, renamed: 0 },
      ])
   })
})
