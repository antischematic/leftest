import { ARIARoleDefinitionKey, roleElements } from "aria-query"

export function withTestId(id: string) {
   return `[${testIdAttribute}="${id}"]`
}

export function withRole(
   name: AriaRole,
   implicit = true
) {
   let selectorsWithAttributes: string[] = []

   if (implicit) {
      const roleRelations = roleElements.get(name as ARIARoleDefinitionKey) ?? []
      selectorsWithAttributes.push(...Array.from(roleRelations)
         .map(relation => {
            let roleSelector = relation.name
            relation.attributes?.forEach(attribute => {
               roleSelector += attribute.value === undefined ? `[${attribute.name}]` : `[${attribute.name}="${attribute.value}"]`
            })
            return roleSelector
         }))
      switch (name) {
         case "graphics-document": {
            selectorsWithAttributes.push('svg')
         }
      }
   }
   selectorsWithAttributes.push(`[role="${name}"]`)
   return selectorsWithAttributes.join(', ')
}

export function withComponent(name: string) {
   return `[${componentAttribute}="${name}"]`
}

let componentAttribute = 'data-component-name'
let testIdAttribute = 'data-testid'

export function setTestIdAttribute(name: string) {
   testIdAttribute = name
}

export function setComponentAttribute(name: string) {
   componentAttribute = name
}

export function selector(selector: string, ...attributeSelectors: string[]) {
   const selectors = selector.split(/,\s*/)
   attributeSelectors = attributeSelectors.flatMap((attr) => attr.split(/,\s*/))

   return selectors.flatMap((tagOrRole) => attributeSelectors.map(attribute => `${tagOrRole}${attribute}`)).join(', ')
}

type ARIAGraphicsRole =
   | 'graphics-document'
   | 'graphics-object'
   | 'graphics-symbol';

export type AriaRole = ARIARoleDefinitionKey | ARIAGraphicsRole
