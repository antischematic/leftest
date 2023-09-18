import { Flag, TestSuiteAdapter, TestSuiteAdapterMetadata } from "@antischematic/leftest"

export class TestAdapter implements TestSuiteAdapter {
   queue = [] as any[]
   thrownError?: any

   afterScenario(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      this.queue.push(impl())
   }

   afterStep(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      this.queue.push(impl())
   }

   beforeScenario(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      this.queue.push(impl())
   }

   beforeStep(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void {
      this.queue.push(impl())
   }

   async step(name: string, description: string, impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): Promise<void> {
      try {
         this.queue.push(await impl())
      } catch (e) {
         this.thrownError = e
      }
   }

   suite(name: string, impl: () => any, flag: Flag): void {
      if (flag !== Flag.SKIP && flag !== Flag.EXCLUDE) {
         this.queue.push(impl())
      }
   }

   test(name: string, impl: (context?: any) => any, { flag }: TestSuiteAdapterMetadata): void {
      if (flag !== Flag.SKIP && flag !== Flag.EXCLUDE) {
         this.queue.push(impl())
      }
   }

   waitForDone() {
      return Promise.allSettled(this.queue)
   }

   constructor(public isAsync: boolean = false) {}
}
