import { ARIARoleDefinitionKey, roleElements } from "aria-query"

interface SelectorOptions {
   ancestor?: string
   component?: string
   role?: AriaRole
   testId?: string
}

export function withTestId(id: string, options: SelectorOptions = {}) {
   return selector(`[${testIdAttribute}="${id}"]`, options)
}

export function withRole(
   name: AriaRole,
   options: SelectorOptions = {},
) {
   const roleRelations = roleElements.get(name as ARIARoleDefinitionKey)
   const selectorsWithAttributes = roleRelations ? Array.from(roleRelations).map(relation => {
      let roleSelector = relation.name
      relation.attributes?.forEach(attribute => {
         roleSelector += attribute.value === undefined ? `[${attribute.name}]` : `[${attribute.name}="${attribute.value}"]`
      })
      return roleSelector
   }) : []
   switch (name) {
      case "graphics-document": {
         selectorsWithAttributes.push('svg')
      }
   }
   selectorsWithAttributes.push(`[role="${name}"]`)
   const roleSelector = selectorsWithAttributes.join(',')
   return selector(roleSelector, options)
}

export function withComponent(name: string, options: SelectorOptions = {}) {
   return selector(`[${componentAttribute}="${name}"]`, options)
}

let componentAttribute = 'data-component-name'
let testIdAttribute = 'data-testid'

export function setTestIdAttribute(name: string) {
   testIdAttribute = name
}

export function setComponentAttribute(name: string) {
   componentAttribute = name
}

export function selector(tag: keyof HTMLElementTagNameMap | '*' | string, options: SelectorOptions = {}) {
   let selector = ''
   if (options.component) {
      selector += withComponent(options.component)
   }
   if (options.role) {
      selector += withRole(options.role)
   }
   if (options.testId) {
      selector += withTestId(options.testId)
   }
   return tag.split(/,\s*/).map(t => `${options.ancestor ?? ''} ${t}${selector}`.trim()).join(', ')
}

type ARIAGraphicsRole =
   | 'graphics-document'
   | 'graphics-object'
   | 'graphics-symbol';

export type AriaRole = ARIARoleDefinitionKey | ARIAGraphicsRole
