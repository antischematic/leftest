import { AriaOptions, AriaRole, withRole } from "@antischematic/leftest"
import { beforeAll, describe } from "vitest"
import { query } from "../component-harness"
import { UnitTestHarnessEnvironment } from "../unit-test-harness-environment"
import { byAria } from "./by-aria"

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
         <title>SVG</title>
      </svg>
      <span aria-hidden="true">Hidden</span>
   </main>
`

function render() {
   document.body.innerHTML = html
}

async function getByRole(role: AriaRole, options?: AriaOptions) {
   const loader = await UnitTestHarnessEnvironment.getRootHarnessLoader()
   const testElement = await loader.getHarness(query(withRole(role), byAria(options)))
   return UnitTestHarnessEnvironment.getNativeElement(testElement)
}

async function getAllByRole(role: AriaRole, options?: AriaOptions) {
   const loader = await UnitTestHarnessEnvironment.getRootHarnessLoader()
   const testElements = await loader.getAllHarnesses(query(withRole(role), byAria(options)))
   return testElements.map((testElement) =>
      UnitTestHarnessEnvironment.getNativeElement(testElement),
   )
}

describe("byRole", () => {
   beforeAll(render)

   it("should find implicit roles", async () => {
      const button = await getByRole("button")
      const link = await getByRole("link")
      const generic = await getByRole("generic")
      const svg = await getByRole("graphics-document")

      expect(button.textContent).toMatch("Button")
      expect(link.textContent).toMatch("Link")
      expect(generic.textContent).toMatch("Generic")
      expect(svg.textContent).toMatch("SVG")
   })

   it("should find explicit roles", async () => {
      const list = await getByRole("list")
      const listItems = await getAllByRole("listitem")

      expect(list.textContent).toMatch("List")
      expect(listItems.map((listItem) => listItem.textContent)).toMatchObject([
         "List Item 1",
         "List Item 2",
         "List Item 3",
      ])
   })

   it("should find by accessible name", async () => {
      const button = await getByRole("button", { name: "Button" })
      const svg = await getByRole("graphics-document", { name: "SVG" })

      expect(button).toBeTruthy()
      expect(svg).toBeTruthy()
   })

   it("should find hidden elements", async () => {
      const hidden = await getByRole("generic", { hidden: true })

      expect(hidden.textContent).toBe('Hidden')
   })
})
