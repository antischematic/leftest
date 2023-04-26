import { createTestSuite } from './core';
import {afterAll, expect, vi} from "vitest";

const log = vi.fn()

const steps = {
    'I run a test'() {
        log('test running')
    },

    'I run a test with <args> and <hello>'(args: string | number, hello: unknown) {
        log(args)
        log(hello)
    }
}

const { describe, scenario, given, when, then, examples, background } = createTestSuite(steps)

describe('Test feature', () => {
    background(() => {
        given('I run a test')
    })

    scenario('Can run test', () => {
        when('I run a test with <args> and <hello>', 'hello', 13)
    })

    scenario('Can run a test with examples', () => {
        given('I run a test with "inline" and [null]')
        when('I run a test with <args> and <hello>')
        then('I run a test with [123] and [456]')
        then('I run a test with <args> and <hello>', 987, 879)

        examples([
            { args: 'example args 1', hello: 234 },
            { args: 'example args 2', hello: 789 }
        ])
    })
})

afterAll(() => {
    expect(log).toHaveBeenCalledWith('test running')
    expect(log).toHaveBeenCalledWith('hello')
    expect(log).toHaveBeenCalledWith('inline')
    expect(log).toHaveBeenCalledWith('example args 1')
    expect(log).toHaveBeenCalledWith('example args 2')
    expect(log).toHaveBeenCalledWith(123)
    expect(log).toHaveBeenCalledWith(987)
    expect(log).toHaveBeenCalledWith(879)
    expect(log).toHaveBeenCalledWith(789)
    expect(log).toHaveBeenCalledWith(234)
    expect(log).toHaveBeenCalledWith(null)
})
