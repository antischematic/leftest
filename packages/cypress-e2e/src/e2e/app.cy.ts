// noinspection BadExpressionStatementJS

import {
   createTestSuite,
   background,
   feature,
   scenario,
   skip,
} from "@antischematic/leftest"
import { custom, include, notThis } from "../fixtures/tags.example"
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

   ~skip
   ~include
   scenario("Skipped", () => {
      given("I explode")
   })

   scenario("Skips after error", () => {
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
