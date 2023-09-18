import {
   afterScenario, afterStep,
   and,
   background, beforeScenario, beforeStep,
   createTestSuite,
   eq, feature,
   getTags, isExcluded, isIncluded, isTagUsed,
   not,
   or, scenario,
   setAdapter,
   setTags,
} from "@antischematic/leftest"
import { afterEach, describe, expect, test } from "vitest"
import { TestAdapter } from "./test-adapter"

const anyValue = {} as any
const { tag, tag2, tag3 } = getTags()

describe('Tags', () => {
   const { and: andThen, but, when, then, given, examples } = createTestSuite(anyValue)
   const tagError = (fn: Function, tag: string) => new Error(`Tag "${tag}" is not allowed on "${fn.name}"`)
   const multipleTagError = (fn: Function, ...tags: string[]) => new Error(`Tags ${tags} are not allowed on "${fn.name}"`)

   afterEach(() => {
      setTags([])
   })

   test('should throw when using tags incorrectly', () => {
      expect(() => {
         ~tag
         setTags(anyValue)
      }).toThrow(tagError(setTags, "tag"))
      expect(() => {
         ~tag
         getTags()
      }).toThrow(tagError(getTags, "tag"))
      expect(() => {
         ~tag
         setAdapter(anyValue)
      }).toThrow(tagError(setAdapter, "tag"))
      expect(() => {
         ~tag
         and(anyValue, anyValue)
      }).toThrow(tagError(and, "tag"))
      expect(() => {
         ~tag
         or(anyValue, anyValue)
      }).toThrow(tagError(or, "tag"))
      expect(() => {
         ~tag
         eq(anyValue)
      }).toThrow(tagError(eq, "tag"))
      expect(() => {
         ~tag
         not(anyValue)
      }).toThrow(tagError(not, "tag"))
      expect(() => {
         ~tag
         background(anyValue)
      }).toThrow(tagError(background, "tag"))
      expect(() => {
         ~tag
         createTestSuite(anyValue)
      }).toThrow(tagError(createTestSuite, "tag"))
      expect(() => {
         ~tag
         given(anyValue)
      }).toThrow(tagError(given, "tag"))
      expect(() => {
         ~tag
         when(anyValue)
      }).toThrow(tagError(when, "tag"))
      expect(() => {
         ~tag
         then(anyValue)
      }).toThrow(tagError(then, "tag"))
      expect(() => {
         ~tag
         andThen(anyValue)
      }).toThrow(tagError(andThen, "tag"))
      expect(() => {
         ~tag
         background(anyValue)
      }).toThrow(tagError(background, "tag"))
      expect(() => {
         ~tag
         but(anyValue)
      }).toThrow(tagError(but, "tag"))
      expect(() => {
         ~tag
         beforeScenario(anyValue)
      }).toThrow(tagError(beforeScenario, "tag"))
      expect(() => {
         ~tag
         afterScenario(anyValue)
      }).toThrow(tagError(afterScenario, "tag"))
      expect(() => {
         ~tag
         beforeStep(anyValue)
      }).toThrow(tagError(beforeStep, "tag"))
      expect(() => {
         ~tag
         afterStep(anyValue)
      }).toThrow(tagError(afterStep, "tag"))
   })

   test('should list all tags', () => {
      expect(() => {
         ~tag
         ~tag2
         ~tag3
         afterStep(anyValue)
      }).toThrow(multipleTagError(afterStep, '"tag", "tag2", and "tag3"'))
   })

   test('should not throw when using tags correctly', () => {
      expect(() => {
         ~tag
         feature(anyValue, anyValue)
      }).not.toThrow(tagError(afterStep, "tag"))
      expect(() => {
         ~tag
         scenario(anyValue, anyValue)
      }).not.toThrow(tagError(afterStep, "tag"))
      expect(() => {
         ~tag
         examples(anyValue, anyValue)
      }).not.toThrow(tagError(afterStep, "tag"))
   })

   test('should include and exclude tags', () => {
      const { include, many, tags, notThis, orThis } = getTags()
      setTags(['include', 'many', 'tags', '^notThis', '^orThis'])

      expect(isIncluded(include)).toBe(true)
      expect(isIncluded(many)).toBe(true)
      expect(isIncluded(tags)).toBe(true)

      expect(isExcluded(notThis)).toBe(true)
      expect(isExcluded(orThis)).toBe(true)
   })

   test('should include and exclude tags using comma delimited string', () => {
      const { include, many, tags, notThis, orThis } = getTags()
      setTags('include, many, tags, ^notThis, ^orThis')

      expect(isIncluded(include)).toBe(true)
      expect(isIncluded(many)).toBe(true)
      expect(isIncluded(tags)).toBe(true)

      expect(isExcluded(notThis)).toBe(true)
      expect(isExcluded(orThis)).toBe(true)
   })

   test('should return cached tag', () => {
      const { tagA } = getTags()
      const { tagA: tagB} = getTags()

      expect(tagA).toBe(tagB)
   })

   test('should return true if tag is used', () => {
      const { theTag } = getTags()
      setAdapter(new TestAdapter())

      ~theTag
      feature('test', () => {})

      expect(isTagUsed(theTag)).toBe(true)
   })
})
