import { ARIARoleDefinitionKey, roleElements } from "aria-query"

interface SelectorOptions {
   ancestor?: string
   component?: string
   testId?: string
}

export function forTestId(id: string) {
   return `[${testIdAttribute}="${id}"]`
}

export function forRole(
   name: AriaRole,
   options: SelectorOptions = {}
) {
   const attributes = selector('', options)
   const roleRelations = roleElements.get(name as ARIARoleDefinitionKey)
   const selectorsWithAttributes = roleRelations ? Array.from(roleRelations)
      .map(relation => {
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
   return selectorsWithAttributes.map(selector => `${selector}${attributes}`).join(', ')
}

function forComponent(name: string) {
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

export function selector(tag: keyof HTMLElementTagNameMap | '*' | string, options: SelectorOptions = {}) {
   let attributes: string = ''
   if (options.component) {
      attributes += forComponent(options.component)
   }
   if (options.testId) {
      attributes += forTestId(options.testId)
   }
   return attributes.split(/,\s*/).map(attribute => `${options.ancestor ?? ''} ${tag}${attribute}`.trim()).join(', ')
}

type ARIAGraphicsRole =
   | 'graphics-document'
   | 'graphics-object'
   | 'graphics-symbol';

export type AriaRole = ARIARoleDefinitionKey | ARIAGraphicsRole
