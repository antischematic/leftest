type ExtractParams<T> = T extends `${string}<${infer TName}>${infer TRemainder}`
   ? [TName, ...ExtractParams<TRemainder>]
   : []

type ExtractData<T extends keyof U, U> = {
   [key in ExtractParams<T>[number]]?: Args<U[T]>[GetIndex<
      ExtractParams<T>,
      key
   >]
}

type GetIndex<T extends string[], R extends string> = {
   [key in keyof T]: T[key] extends R ? key : never
}[number]

type ExtractAllData<T> = {
   [key in keyof T]: key extends `${string}<${string}>${string}`
      ? ExtractData<key, T>
      : never
}[keyof T]

type Args<T> = T extends (...args: infer R) => void ? R : []

type GetPlaceholder<T> = T extends string
   ? `'${string}'` | `"${string}"`
   : T extends number | boolean | null | undefined
   ? `[${T}]`
   : GetPlaceholder<string | number | boolean | null | undefined>

type ExpandArgs<
   T,
   TArgs extends unknown[],
> = T extends `${infer TStart}<${string}>${infer TRemainder}`
   ? TArgs extends [infer TType, ...infer TArgsRemainder]
      ? `${TStart}${GetPlaceholder<TType>}${ExpandArgs<
           TRemainder,
           TArgsRemainder
        >}`
      : never
   : T
type ExpandKey<
   T,
   TArgs extends unknown[],
> = T extends `${string}<${string}>${string}` ? ExpandArgs<T, TArgs> : T

export interface TestSuite<T> {
   given<U extends keyof T>(step: U): void
   given<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   given<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   when<U extends keyof T>(step: U): void
   when<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   when<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   then<U extends keyof T>(step: U): void
   then<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   then<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   and<U extends keyof T>(step: U): void
   and<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   and<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   but<U extends keyof T>(step: U): void
   but<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   but<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   examples(
      tags: string,
      data: unknown extends T ? any[] : ExtractAllData<T>[],
   ): void
   examples(data: unknown extends T ? any[] : ExtractAllData<T>[]): void
   feature(tags: string, name: string, fn: () => void): void
   feature(name: string, fn: () => void): void
   describe(name: string, fn: () => void): void
   suite(name: string, fn: () => void): void
   background(fn: () => void): void
   scenario(tags: string, name: string, fn: () => void): void
   scenario(name: string, fn: () => void): void
}

export interface TestSuiteOptions {}

export interface TestSuiteAdapter {
   createSuite(name: string, impl: () => void): void
   createTest(name: string, impl: () => void): void
   skipTest?(context: any): void
}
