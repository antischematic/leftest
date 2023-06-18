import {
   afterScenario,
   and,
   beforeScenario,
   eq,
   getAllScenarios,
   getTags,
   not, only,
   or,
   ReadonlyScenario,
} from "@antischematic/leftest"
import FetchAdapter from "@pollyjs/adapter-fetch"
import XHRAdapter from "@pollyjs/adapter-xhr"
import { MODE, Polly, Timing } from "@pollyjs/core"
import { isTagUsed } from "../../../core/src/lib/core"
import CypressPersister from "./cypress-persister"

export const { record, replay } = getTags()

Polly.register(FetchAdapter)
Polly.register(XHRAdapter)
Polly.register(CypressPersister)

export interface RecorderOptions {
   fixture: string
   mode: MODE
   data?: any
   recordIfMissing?: boolean
}

let data: { [key: string]: any }
const recordings = []

function setupPolly({ fixture, mode, data, recordIfMissing = false }: RecorderOptions) {
   const polly = new Polly(fixture, {
      mode,
      adapters: ["fetch", "xhr"],
      persister: "cypress-persister",
      persisterOptions: {
         "cypress-persister": {
            data,
         },
      },
      recordFailedRequests: true,
      timing: Timing.fixed(0),
      flushRequestsOnStop: true,
      recordIfMissing
   })

   polly.server.any().on("response", (request, response, event) => {
      Cypress.log({
         name: "polly",
         type: "parent",
         message: mode === 'record'
            ? `Recorded request for ${request.url}`
            : `Replayed request for ${request.url}`,
         consoleProps() {
            return {
               request,
               response,
               event,
            }
         },
      })
   })

   return polly
}

function getFixture(scenario: ReadonlyScenario) {
   return scenario.path.join(" ")
}

function setupBeforeLoadListener(scenario: ReadonlyScenario) {
   const polly = scenario.data.polly as Polly
   const beforeLoad = (scenario.data.windowBeforeLoad = (window: Window) => {
      polly.configure({
         adapterOptions: {
            fetch: { context: window },
            xhr: { context: window },
         },
      })
      polly.connectTo("fetch")
      polly.connectTo("xhr")
   })

   Cypress.on("window:before:load", beforeLoad)
}

beforeScenario(eq(record), (scenario) => {
   if (scenario.data.polly) return
   const fixture = getFixture(scenario)
   scenario.data.polly = setupPolly({
      fixture,
      mode: "record"
   })
   setupBeforeLoadListener(scenario)
})

afterScenario(or(record, replay), (scenario) => {
   const polly = scenario.data.polly as Polly
   recordings.push(polly.persister)
   Cypress.off(
      "window:before:load",
      scenario.data.windowBeforeLoad as VoidFunction,
   )
   cy.then(() => polly.stop())
})

beforeScenario(eq(replay), (scenario) => {
   if (scenario.data.polly) return
   const fixture = getFixture(scenario)
   scenario.data.polly = setupPolly({
      fixture,
      mode: "replay",
      data,
   })
   setupBeforeLoadListener(scenario)
})

before(() => {
   cy.task("loadData", {
      folder: Cypress.config("fixturesFolder"),
      spec: Cypress.spec.name,
   }).then((results = {}) => {
      data = results
   })
})

after(() => {
   const scenarios = getAllScenarios()
   const fixtures = scenarios
      .filter((scenario) => scenario.hasTag(record) || scenario.hasTag(replay))
      .map(getFixture)
   cy.task("saveData", {
      folder: Cypress.config("fixturesFolder"),
      spec: Cypress.spec.name,
      data: recordings,
      fixtures,
      clean: !isTagUsed(only)
   })
})
