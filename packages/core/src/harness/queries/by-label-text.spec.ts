import {
   byDisplayValue,
   queryByLabelText,
   UnitTestHarnessEnvironment,
} from "@antischematic/leftest"
import { beforeAll } from "vitest"

const html = `
   <label for="test1">Label 1</label>
   <input id="test1" value="Test 1" />
   <label>
      <span>Label 2</span>
      <input value="Test 2" />
   </label>
   <label for="test3">Label 3</label>
   <textarea id="test3">Test 3</textarea>
   <label>
      <span>Label 4</span>
      <select>
         <option value="Test 4"></option>
      </select>
   </label>
`

function render() {
   document.body.innerHTML = html
}

describe('byDisplayValue', () => {
   beforeAll(render)

   it("should get by display value", async () => {
      const loader = await UnitTestHarnessEnvironment.getRootHarnessLoader()
      const test1 = await loader.getHarness(queryByLabelText('Label 1'))
      const test2 = await loader.getHarness(queryByLabelText(/Label 2/))
      const test3 = await loader.getHarness(queryByLabelText('Label 3'))
      const test4 = await loader.getHarness(queryByLabelText(text => text.includes('Label 4')))

      expect(await test1.getProperty('value')).toBe('Test 1')
      expect(await test2.getProperty('value')).toBe('Test 2')
      expect(await test3.getProperty('value')).toBe('Test 3')
      expect(await test4.getProperty('value')).toBe('Test 4')
   })
})
