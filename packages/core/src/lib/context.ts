const refs = new Set<any>()

export function clearTestContext() {
   for (const ref of refs) {
      for (const key in ref) {
         delete ref[key]
      }
   }
   refs.clear()
}

function assertNotEmpty(target: any, p: any) {
   if (!Reflect.has(target, p)) {
      throw new Error(`Cannot access context value "${p}" before it has been set`)
   }
}

export function createTestContext<T extends Record<string, any>>(): T {
   let context = {}

   return new Proxy(context, {
      get(target, p) {
         assertNotEmpty(target, p)
         return Reflect.get(target, p)
      },
      set(target, p, newValue) {
         refs.add(context)
         return Reflect.set(target, p, newValue)
      }
   }) as any
}
