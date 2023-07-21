import {
    ComponentHarness, ComponentHarnessConstructor,
    ElementDimensions, EventData,
    HarnessEnvironment,
    ModifierKeys,
    TestElement,
    TestKey,
    TextOptions
} from "../index";
import {fireEvent} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {_getTextWithExcludedElements} from "../text-filtering";

class JestElement implements TestElement {
    private user = userEvent.setup()

    async blur(): Promise<void> {
        (this.element as any).blur?.()
    }

    async clear(): Promise<void> {
        if ("value" in this.element) {
            this.element.value = null
            fireEvent(this.element, new InputEvent('input'))
        }
    }

    async click(modifiers?: ModifierKeys): Promise<void>;
    async click(location: "center", modifiers?: ModifierKeys): Promise<void>;
    async click(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void>;
    async click(): Promise<void> {
        return this.element.click()
    }

    async dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void> {
        const event = new Event(name, data)
        this.element.dispatchEvent(event)
    }

    async focus(): Promise<void> {
        return (this.element as any).focus?.()
    }

    async getAttribute(name: string): Promise<string | null> {
        return this.element.getAttribute(name)
    }

    async getCssValue(property: string): Promise<string> {
        return (window.getComputedStyle(this.element) as any)[property];
    }

    async getDimensions(): Promise<ElementDimensions> {
        return this.element.getBoundingClientRect()
    }

    async getProperty<T = any>(name: string): Promise<T> {
        return (this.element as any)[name]
    }

    async hasClass(name: string): Promise<boolean> {
        return this.element.classList.contains(name)
    }

    hover(): Promise<void> {
        return this.user.hover(this.element)
    }

    async isFocused(): Promise<boolean> {
        return window.document.activeElement === this.element
    }

    async matchesSelector(selector: string): Promise<boolean> {
        return this.element.matches(selector)
    }

    mouseAway(): Promise<void> {
        return this.user.unhover(this.element)
    }

    async rightClick(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void> {
        fireEvent(this.element, new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: false,
            view: window,
            button: 2,
            buttons: 2,
            clientX: this.element.getBoundingClientRect().x,
            clientY: this.element.getBoundingClientRect().y
        }))
    }

    selectOptions(...optionIndexes: number[]): Promise<void> {
        const options = Array.from(this.element.querySelectorAll('option'))
        const filteredOptions = optionIndexes.map(i => options[i])
        return this.user.selectOptions(this.element, filteredOptions)
    }

    async sendKeys(...keys: (string | TestKey)[]): Promise<void>;
    async sendKeys(modifiers: ModifierKeys, ...keys: (string | TestKey)[]): Promise<void>;
    async sendKeys(...keys: (string | TestKey | ModifierKeys)[]): Promise<void> {
        return this.user.type(this.element, keys.join(''))
    }

    async setInputValue(value: string): Promise<void> {
        this.element.setAttribute('value', value)
        fireEvent(this.element, new Event('input', { bubbles: true }))
    }

    async text(options?: TextOptions): Promise<string> {
        if (options?.exclude) {
            return _getTextWithExcludedElements(this.element, options.exclude)
        }
        return (this.element.textContent || '').trim()
    }

    constructor(public element: HTMLElement) {}
}

export async function getElement(query: ComponentHarness | TestElement) {
    if (query instanceof ComponentHarness) {
        return getElement(await query.host())
    }
    return (query as JestElement).element
}

export class JestHarnessEnvironment extends HarnessEnvironment<HTMLElement> {
    static harnessForContainer<T extends ComponentHarness>(fixture: HTMLElement, harness: ComponentHarnessConstructor<T>): Promise<T> {
        return new JestHarnessEnvironment(fixture).getHarness(harness);
    }

    static documentRootLoader(container: HTMLElement) {
        return new JestHarnessEnvironment(container.ownerDocument.body)
    }

    protected createEnvironment(element: HTMLElement): HarnessEnvironment<HTMLElement> {
        return new JestHarnessEnvironment(element);
    }

    protected createTestElement(element: HTMLElement): TestElement {
        return new JestElement(element);
    }

    forceStabilize(): Promise<void> {
        return Promise.resolve(undefined);
    }

    protected async getAllRawElements(selector: string): Promise<HTMLElement[]> {
        return Array.from(this.getDocumentRoot().querySelectorAll(selector))
    }

    protected getDocumentRoot(): HTMLElement {
        return this.rawRootElement.ownerDocument.body
    }

    waitForTasksOutsideAngular(): Promise<void> {
        return Promise.resolve(undefined);
    }

}
