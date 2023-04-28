# @antischematic/leftest-cypress

Shift-Left Testing for Cypress

## Installation

```bash
npm add @antischematic/leftest-cypress
```

## Usage

> This library **requires** Cypress to be configured with `testIsolation: false`. [Read more](https://docs.cypress.io/guides/core-concepts/test-isolation)

Define your feature specs

```ts
import { createTestSuite } from "@antischematic/leftest-cypress"

const { feature, scenario, given, when, then, examples, background } =
   createTestSuite()

feature("My awesome new feature", () => {
   background(() => {
      given("I am logged in as 'Bob'")
   })

   scenario("User can do awesome things", () => {
      given("I visit '/my-awesome-page'")
      when("I press the button [5] times")
      then("Something <awesome> happens")

      examples([
         { awesome: "hello world" },
         { awesome: 1337 },
         { awesome: true },
         { awesome: ["foo", "bar"] },
      ])
   })
})
```

Implement steps in a `steps.ts` file

```ts
export default {
   "I am logged in as <user>": (user: string) => {
      cy.session(user, () => {
         cy.visit("/login")
         cy.get('input[name="user"]').type(user)
         cy.get('input[name="password"]').type("s3cr3t")
         cy.get('input[type="submit"]').click()
      })
   },
   "I visit <page>": (page: string) => {
      cy.visit(page)
   },
   "I press the button <several> times": (several: number) => {
      for (let i = 0; i < several; i++) {
         cy.get("button").click()
      }
   },
   "Something <awesome> happens": (awesome: unknown) => {
      cy.log("What's awesome?:", awesome)
   },
}
```

Import steps into your feature and (optionally) extract placeholder arguments.

```ts
import { createTestSuite } from "@antischematic/leftest-cypress"
import steps from "./steps"

const { feature, scenario, given, when, then, examples, background } =
   createTestSuite(steps) // that's it!

feature("My awesome new feature", () => {
   background(() => {
      given("I am logged in as <user>", "Bob")
   })

   scenario("User can do awesome things", () => {
      given("I visit <page>", "/my-awesome-page")
      when("I press the button <several> times", 5)
      then("Something <awesome> happens")

      examples([
         { awesome: "hello world" },
         { awesome: 1337 },
         { awesome: true },
         { awesome: ["foo", "bar"] },
      ])
   })
})
```
