
import {ExtractReturn, TestSuite, UnionToIntersection} from "./types";

import {describe, it} from "vitest"

function stripDelimiters(string: string) {
    return string.slice(1, string.length - 1)
}

function getValue(expr: string) {
    switch (expr) {
        case "true": return true
        case "false": return false
        case "null": return null
        case "undefined": return undefined
        default: return Number(expr)
    }
}

function normalize(step: string) {
    return step.replace(/('[^\s]*?'|"[^\s]*?"|<[^\s]*?>|\[[^\s]*?\])/g, '%%var%%')
}

function parseArguments(step: string, args: readonly any[], steps: Steps) {
    // eg. "foo[20]bar" = ["foo", "[20]", "bar"]
    const tokens = step.split(/(\[[^\s]*?\]|'[^\s]*?'|"[^\s]*?")|\[[^\s]*?\]/)
    const parsedArgs = [] as unknown[]
    tokens.forEach((value) => {
        const expr = stripDelimiters(value)
        switch (value.slice(-1)) {
            case ']':
                parsedArgs.push(getValue(expr))
                break
            case "'":
            case '"':
                parsedArgs.push(expr)
        }
    })
    return parsedArgs
}

class Scenario {
    failed = false
    steps: any[] = []
    examples: any[] = []

    addStep(factory: (name: string, fn: (...args: any[]) => void) => void): void {
        this.steps.push(factory)
    }

    addExamples(data: any[]) {
        this.examples.push(data)
    }

    markAsFailed() {
        this.failed = true
    }

    constructor(public name: string) {}
}

interface Context {
    scenario: Scenario
    examples: readonly any[]
    data?: any
}

const rootScenario: Scenario = new Scenario('root')

rootScenario.addStep = function () {
    throw new Error("Steps can only be added inside a scenario")
}

let context: Context = {
    scenario: rootScenario,
    examples: Object.freeze([])
}

function setContext(nextContext: Context) {
    const previousContext = context
    context = nextContext
    return previousContext
}

function runSteps(combinedSteps: any[], scenario: Scenario, examples: readonly any[], data?: any) {
    const previousExample = setContext({
        scenario,
        examples,
        data
    })
    try {
        for (const step of combinedSteps) {
            step()
        }
    } finally {
        setContext(previousExample)
    }
}

function scenario(name: string, fn: () => void) {
    const backgroundSteps = context.scenario.steps
    describe(name, () => {
        const scenario = new Scenario(name)
        const previous = setContext({
            scenario,
            examples: []
        })
        try {
            fn()
            const combinedSteps = [...backgroundSteps, ...scenario.steps]
            if (!scenario.examples.length) {
                runSteps(combinedSteps, context.scenario, context.examples)
            } else {
                for (const examples of scenario.examples) {
                    const len = examples.length
                    for (const [index, data] of examples.entries()) {
                        describe(`Example ${index + 1} of ${len}`, () => {
                            runSteps(combinedSteps, scenario, [], data)
                        })
                    }
                }
            }
        } finally {
            setContext(previous)
        }
    })
}

function feature(name: string, fn: () => void) {
    describe(name, () => {
        const scenario = new Scenario(name)
        const previous = setContext({
            scenario,
            examples: []
        })
        try {
            fn()
        } finally {
            setContext(previous)
        }
    })
}

function background(fn: () => void) {
    fn()
}

function examples(data: any[]) {
    context.scenario.addExamples(data)
}

function createStep(steps: Steps) {
    return function step(step: string, ...args: readonly any[]) {
        const { scenario } = context
        scenario.addStep(() => {
            let parsedArgs = args as any[]
            if (!parsedArgs.length) {
                parsedArgs = parseArguments(step, args, steps)
            }
            if (!parsedArgs.length) {
                console.log(JSON.stringify( context.data))
                parsedArgs = steps.getArgsFromObject(step, context.data)
            }
            if (!parsedArgs.length && steps.hasArgs(step)) {
                throw new Error("Args missing")
            }
            const testName = steps.getTestName(step, parsedArgs)
            const impl = steps.getImplementation(step)
            if (testName) {
                it(testName, async () => {
                    if (scenario.failed) {
                        throw new Error('Previous step failed')
                    }
                    try {
                        await impl(...parsedArgs)
                    } catch (e) {
                        scenario.markAsFailed()
                        throw e
                    }
                })
            }
        })
    }
}

function splitVars(name: string) {
    return (name.split(/(<[^\s]*?>)/g) ?? []).map(s => s.startsWith('<') ? { var: stripDelimiters(s) } : s)
}

function expandSteps(list: any[]): any[] {
    return list.flatMap((item) => Object.entries(item))
}

class Steps {
    normalNames: Record<string, { name: string, vars: any[], impl: (...args: any[]) => void }>

    getTestName(step: string, args: readonly any[]) {
        const copy = args.slice(0)
        return this.normalNames[normalize(step)]?.vars.map((s) => {
            return typeof s === "string" ? s : copy.shift()
        }).join('') ?? ''
    }

    getImplementation(step: string) {
        return this.normalNames[normalize(step)]?.impl
    }

    getArgsFromObject(step: string, data: Record<string, unknown>) {
        return this.normalNames[normalize(step)]?.vars
            .filter(s => !(typeof s === "string"))
            .map((s) => data[s.var]) ?? []
    }

    hasArgs(step: string) {
        return this.normalNames[normalize(step)]?.vars.length > 1
    }

    constructor(private steps: any) {
        this.normalNames = {}

        for (const [name, impl] of Object.entries(steps)) {
            this.normalNames[normalize(name)] = {
                name,
                vars: splitVars(name),
                impl: impl as (...args: any[]) => void
            }
        }
    }
}

export function createTestSuite(): TestSuite<unknown>
export function createTestSuite<T extends () => any>(steps: T): TestSuite<T & UnionToIntersection<ExtractReturn<T>>>
export function createTestSuite<T extends () => any>(stepDefinitions?: T): TestSuite<any> {
    const steps = new Steps(stepDefinitions)
    const step = createStep(steps)

    return {
        given: step,
        when: step,
        then: step,
        and: step,
        but: step,
        examples,
        feature,
        scenario,
        background,
        describe: feature
    } as any
}
