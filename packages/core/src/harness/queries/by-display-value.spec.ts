import {
   byDisplayValue,
   query,
   UnitTestHarnessEnvironment,
} from "@antischematic/leftest"
import { beforeAll } from "vitest"

const html = `
   <input name="test1" value="Test 1" />
   <input name="test2" type="checkbox" checked />
   <select name="test3">
      <option>Option 1</option>
      <option selected>Option 2</option>
      <option>Option 3</option>
   </select>
   <select multiple name="test4">
      <option>Option 1</option>
      <option selected>Option 2</option>
      <option selected>Option 3</option>
   </select>
   <textarea name="test5">
      Test 5
   </textarea>
`

function render() {
   document.body.innerHTML = html
}

describe("byDisplayValue", () => {
   beforeAll(render)

   it("should get by display value", async () => {
      const loader = await UnitTestHarnessEnvironment.getRootHarnessLoader()
      const test1 = await loader.getHarness(query(byDisplayValue("Test 1")))
      const test1Name = await test1.getAttribute("name")
      const test2 = await loader.getHarness(query(byDisplayValue("checked")))
      const test2Name = await test2.getAttribute("name")
      const test3 = await loader.getHarness(query(byDisplayValue(/Option 2/)))
      const test3Name = await test3.getAttribute("name")
      const test4 = await loader.getHarness(query(byDisplayValue("Option 3")))
      const test4Name = await test4.getAttribute("name")
      const test5 = await loader.getHarness(
         query(byDisplayValue((text) => text.includes("Test 5"))),
      )
      const test5Name = await test5.getAttribute("name")

      expect(test1Name).toBe("test1")
      expect(test2Name).toBe("test2")
      expect(test3Name).toBe("test3")
      expect(test4Name).toBe("test4")
      expect(test5Name).toBe("test5")
   })
})
