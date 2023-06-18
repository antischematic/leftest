import Persister, { Har } from "@pollyjs/persister"

export default class CypressPersister extends Persister {
   store: { [key: string]: Har }

   constructor() {
      // @ts-ignore
      super(...arguments)
      this.store = { ...(<any>this.options).data }
   }

   static get id() {
      return 'cypress-persister';
   }

   async onFindRecording(recordingId) {
      return this.store[recordingId] || null;
   }

   async onSaveRecording(recordingId, data) {
      this.store[recordingId] = data;
   }

   async onDeleteRecording(recordingId) {
      delete this.store[recordingId];
   }

   toJSON() {
      return this.store
   }
}
