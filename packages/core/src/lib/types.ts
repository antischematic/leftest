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
}[keyof T] & {
   [key: string]: unknown
}

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

type ExpandPlaceholder<T> =
   T extends `${infer TStart}<${string}>${infer TRemainder}`
      ? `${TStart}<${string}>${ExpandPlaceholder<TRemainder>}`
      : T

export interface TestSuite<T> {
   given<U extends keyof T>(step: U): void
   given<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   given<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   given<U extends keyof T>(step: ExpandPlaceholder<U>): void
   given<U extends keyof T>(
      step: ExpandPlaceholder<U>,
      ...params: Args<T[U]>
   ): void
   when<U extends keyof T>(step: U): void
   when<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   when<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   when<U extends keyof T>(step: ExpandPlaceholder<U>): void
   when<U extends keyof T>(
      step: ExpandPlaceholder<U>,
      ...params: Args<T[U]>
   ): void
   then<U extends keyof T>(step: U): void
   then<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   then<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   then<U extends keyof T>(step: ExpandPlaceholder<U>): void
   then<U extends keyof T>(
      step: ExpandPlaceholder<U>,
      ...params: Args<T[U]>
   ): void
   and<U extends keyof T>(step: U): void
   and<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   and<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   and<U extends keyof T>(step: ExpandPlaceholder<U>): void
   and<U extends keyof T>(
      step: ExpandPlaceholder<U>,
      ...params: Args<T[U]>
   ): void
   but<U extends keyof T>(step: U): void
   but<U extends keyof T>(step: ExpandKey<U, Args<T[U]>>): void
   but<U extends keyof T>(step: U, ...params: Args<T[U]>): void
   but<U extends keyof T>(step: ExpandPlaceholder<U>): void
   but<U extends keyof T>(
      step: ExpandPlaceholder<U>,
      ...params: Args<T[U]>
   ): void
   examples(description: string, data: unknown extends T ? any[] : ExtractAllData<T>[]): void
   examples(data: unknown extends T ? any[] : ExtractAllData<T>[]): void
}

export interface TestSuiteOptions {
   // @deprecated Alternative method for stringifying placeholder arguments. Don't use this for new tests.
   stringifyPlaceholderArguments?: boolean
}

export interface TestSuiteAdapterMetadata {
   flag?: Flag,
   steps: readonly Function[]
   beforeScenario: readonly Function[]
   afterScenario: readonly Function[]
   beforeStep: readonly Function[]
   afterStep: readonly Function[]
}

export interface TestSuiteAdapter {
   isAsync: boolean
   suite(name: string, impl: () => void, flag: Flag): void
   test(name: string, impl: (context?: any) => void, metadata: TestSuiteAdapterMetadata): void
   step(name: string, description: string, impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void
   beforeScenario(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void
   afterScenario(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void
   beforeStep(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void
   afterStep(impl: (context?: any) => any, metadata: TestSuiteAdapterMetadata): void
}

export enum Flag {
   DEFAULT,
   SKIP,
   ONLY,
   EXCLUDE,
}

export interface Tag {
   name: string
}

export type TagFilter = (matcher: Tag | TagFilter) => boolean

export interface ReadonlyFeature {
   name: string
   hasTag(tag: Tag): boolean
   hasOwnTag(tag: Tag): boolean
}

export interface ReadonlyScenario {
   readonly name: string
   readonly path: string[]
   readonly failed: boolean
   readonly steps: readonly unknown[]
   readonly feature: ReadonlyFeature
   readonly parent?: ReadonlyScenario
   readonly data: { [key: string]: unknown }
   hasTag(tag: Tag): boolean
   hasOwnTag(tag: Tag): boolean
}
