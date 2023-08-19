
import { parallel, RoleOptions } from "@antischematic/leftest"
import { UnitTestHarnessEnvironment } from "../unit-test-harness-environment"
import { byRole } from "./by-role"
import { AriaRole } from "../selector"
import { ContentContainerComponentHarness, query } from "../component-harness"
import { beforeAll, describe } from "vitest"

const html = `
   <main>
      <button>Button</button>
      <a>Generic</a>
      <a href="https://example.com">Link</a>
      <div role="list">
         <span>List</span>
         <div role="listitem">List Item 1</div>
         <div role="listitem">List Item 2</div>
         <div role="listitem">List Item 3</div>
      </div>
      <span>TabList</span>
      <div role="tablist" aria-labelledby="tablist-label">
         <div role="tab" aria-label="Tab"></div>
      </div>
      <svg>
         <desc>SVG</desc>
      </svg>
   </main>
`

function render() {
   document.body.innerHTML = html
}

class TestHarness extends ContentContainerComponentHarness {
   static hostSelector = "main"

   async getByRole(role: AriaRole | string, options?: RoleOptions) {
      const harness = await this.getHarness(query(byRole(role, options)))
      return harness.host()
   }

   async getAllByRole(role: AriaRole | string) {
      const harnesses = await this.getAllHarnesses(query(byRole(role)))
      return parallel(() => harnesses.map(harness => harness.host()))
   }
}

async function getByRole(role: AriaRole, options?: RoleOptions) {
   const harness = await UnitTestHarnessEnvironment.getHarness(TestHarness)
   const testElement = await harness.getByRole(role, options)
   return UnitTestHarnessEnvironment.getNativeElement(testElement)
}

async function getAllByRole(role: AriaRole) {
   const harness = await UnitTestHarnessEnvironment.getHarness(TestHarness)
   const testElements = await harness.getAllByRole(role)
   return testElements.map(testElement => UnitTestHarnessEnvironment.getNativeElement(testElement))
}

describe('byRole', () => {
   beforeAll(render)

   it('should find implicit roles', async () => {
      const button = await getByRole("button")
      const link = await getByRole("link")
      const generic = await getByRole("generic")
      const svg = await getByRole('graphics-document')

      expect(button.textContent).toMatch("Button")
      expect(link.textContent).toMatch("Link")
      expect(generic.textContent).toMatch("Generic")
      expect(svg.textContent).toMatch("SVG")
   })

   it('should find explicit roles', async () => {
      const list = await getByRole("list")
      const listItems = await getAllByRole("listitem")

      expect(list.textContent).toMatch("List")
      expect(listItems.map(listItem => listItem.textContent)).toMatchObject(['List Item 1', 'List Item 2', 'List Item 3'])
   })

   it('should find by accessible name', async () => {
      const button = await getByRole("button", { name: 'Button' })
      const svg = await getByRole("graphics-document", { name: 'SVG' })

      expect(button).toBeTruthy()
      expect(svg).toBeTruthy()
   })
})

