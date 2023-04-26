import { createTestSuite } from './core';
import {afterAll, expect, vi} from "vitest";

const steps = () => []

const log = vi.fn()

steps['run a test'] = () => {
    log('test running')
}

steps['run a test with <args> and <hello>'] = (args: string | number, hello: unknown) => {
    log(args)
    log(hello)
}

const { describe, scenario, given, when, then, examples, background } = createTestSuite(steps)

describe('test', () => {
    background(() => {
        given('run a test')
    })

    scenario('run test', () => {
        when('run a test with <args> and <hello>', 'hello', 13)
    })

    scenario('run a test with examples', () => {
        given('run a test with "inline" and [null]')
        when('run a test with <args> and <hello>')
        then('run a test with [123] and [456]')
        then('run a test with <args> and <hello>', 987, 879)

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
