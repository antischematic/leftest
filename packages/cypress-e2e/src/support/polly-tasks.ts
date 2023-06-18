import { Har } from "@pollyjs/persister"
import * as Cypress from "cypress"
import * as fs from "fs"
import * as path from "path"

interface RecordEvent {
   folder: string
   spec: string
   path: string
   data: { [key: string]: Har }[]
   fixtures: string[]
   clean: boolean
}

function getFileName(folder: string, spec: string) {
   return path.join(folder, `${spec}.json`)
}

function ensureFolderExists(dir: string) {
   if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
   }
}

export function setupPollyTasks(on: Cypress.PluginEvents) {
   return on('task', {
      loadData({ folder, spec }: RecordEvent) {
         const filename = getFileName(folder, spec)
         if (fs.existsSync(filename)) {
            return JSON.parse(fs.readFileSync(filename, 'utf-8'))
         }
         return null
      },
      saveData({ folder, spec, data, fixtures, clean }: RecordEvent) {
         const existing = new Set(fixtures)
         const filename = getFileName(folder, spec)
         const recordings = Object.assign({}, ...data) as { [key: string]: any }
         ensureFolderExists(folder)

         if (clean) {
            for (const [key, recording] of Object.entries(recordings)) {
               if (!existing.has(recording.log._recordingName)) {
                  delete recordings[key]
               }
            }
         }

         fs.writeFileSync(filename, JSON.stringify(recordings, null, 2), 'utf-8')
         return null
      },
   })
}
