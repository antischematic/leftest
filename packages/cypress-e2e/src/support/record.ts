import {
   afterScenario,
   and,
   beforeScenario,
   beforeStep, eq, getTags, not,
} from "@antischematic/leftest"
import {
   interceptRequests,
   makeFilePath,
   startRecording,
   startReplay,
   interceptReplay,
   stopReplay,
   stopRecording,
} from "cypress-replay"

export const { record, replay } = getTags()

const recordOnly = and(eq(record), not(replay))
const replayOnly = and(eq(replay), not(record))

beforeScenario(recordOnly, () => {
  startRecording({})
})

beforeStep(recordOnly, () => {
  interceptRequests({});
})

afterScenario(recordOnly, (scenario) => {
  stopRecording(makeFilePath(Cypress.spec.name, scenario.parent ? [scenario.feature.name, scenario.parent.name, scenario.name] : [scenario.feature.name, scenario.name]))
})

beforeScenario(replayOnly, (scenario) => {
  startReplay(makeFilePath(Cypress.spec.name, scenario.parent ? [scenario.feature.name, scenario.parent.name, scenario.name] : [scenario.feature.name, scenario.name]))
})

beforeStep(replayOnly, () => {
   interceptReplay({});
})

afterScenario(replayOnly, () => {
  stopReplay()
})
