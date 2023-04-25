import {createTestSuite} from "leftest-core";
import {afterAll, expect, vi} from "vitest";

const steps = () => []

const log = vi.fn()

steps['run a test'] = () => {
    log('test running')
}

steps['run a test with <args>'] = (args: string | number) => {
    log(args)
}

const { describe, scenario, given, when, then, examples, background } = createTestSuite(steps)

describe('test', () => {
    background(() => {
        given('run a test')
    })

    scenario('run test', () => {
        when('run a test with <args>', 'hello')
    })

    scenario('run a test with examples', () => {
        given('run a test with "inline"')
        when('run a test with <args>')
        then('run a test with [123]')

        examples([
            { args: 'example args 1' },
            { args: 'example args 2' }
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
})
