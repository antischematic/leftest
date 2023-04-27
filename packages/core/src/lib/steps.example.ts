import { vi } from "vitest"

export const log = vi.fn()

export default {
   "I run a test": () => {
      log("test running")
   },

   "I run a test with <args> and <hello>": (
      args: string | number,
      hello: unknown,
   ) => {
      log(args)
      log(hello)
   },
}
