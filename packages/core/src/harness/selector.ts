interface SelectorOptions {
   component?: string
   role?: Roles | RolesWithFallback | string
   testId?: string
}

export function withTestId(id: string, options: SelectorOptions = {}) {
   return selector(`[${testIdAttribute}="${id}"]`, options)
}

export function withRole(
   name: Roles | RolesWithFallback | string,
   options: SelectorOptions = {},
) {
   return selector(`[role="${name}"]`, options)
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

export function selector(tag: string, options: SelectorOptions = {}) {
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
   return tag.split(/,\s*/).map(t => t + selector).join(', ')
}

type RolesWithFallback = `${Roles} ${string}`

type Roles =
   | "alert"
   | "alertdialog"
   | "application"
   | "article"
   | "banner"
   | "button"
   | "cell"
   | "checkbox"
   | "columnheader"
   | "combobox"
   | "command"
   | "complementary"
   | "composite"
   | "contentinfo"
   | "definition"
   | "dialog"
   | "directory"
   | "document"
   | "feed"
   | "figure"
   | "form"
   | "grid"
   | "gridcell"
   | "group"
   | "heading"
   | "img"
   | "input"
   | "landmark"
   | "link"
   | "list"
   | "listbox"
   | "listitem"
   | "log"
   | "main"
   | "marquee"
   | "math"
   | "menu"
   | "menubar"
   | "menuitem"
   | "menuitemcheckbox"
   | "menuitemradio"
   | "navigation"
   | "note"
   | "option"
   | "presentation"
   | "progressbar"
   | "radio"
   | "radiogroup"
   | "range"
   | "region"
   | "roletype"
   | "row"
   | "rowgroup"
   | "rowheader"
   | "scrollbar"
   | "search"
   | "searchbox"
   | "section"
   | "sectionhead"
   | "select"
   | "separator"
   | "slider"
   | "spinbutton"
   | "status"
   | "structure"
   | "tab"
   | "table"
   | "tablist"
   | "tabpanel"
   | "term"
   | "textbox"
   | "timer"
   | "toolbar"
   | "tooltip"
   | "tree"
   | "treegrid"
   | "treeitem"
   | "widget"
   | "window"
   | "none"
