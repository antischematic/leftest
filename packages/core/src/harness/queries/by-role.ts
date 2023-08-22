
import { parallel } from "../change-detection"
import { ComponentHarness, predicate } from "../component-harness"
import { AriaRole, withRole } from "../selector"
import { matchText, TextPredicate } from "./by-text"

export interface RoleOptions {
   name?: string | RegExp | TextPredicate
}

function prettyOptions(obj: any) {
   let pretty = ''
   for (const [key, value] of Object.entries(obj)) {
      pretty += `\t\t${key}: ${JSON.stringify(value)}\n`
   }
   return pretty
}

export function byRole(role: AriaRole | string, options: RoleOptions = {}) {
   const description = `matching role "${role}"${Object.keys(options).length ? `\n\twith options:\n${prettyOptions(options)}` : ''}`
   return predicate(
      description,
      async function byRole(harness: ComponentHarness) {
         const host = harness.host()
         const matchesRole = await host.matchesSelector(withRole(role))
         let [tagName, innerText, textContent, attributes, children, document] = await parallel(() => [host.getProperty('tagName'), host.getProperty('innerText'), host.getProperty('textContent'), host.getProperty('attributes'), host.getProperty('children'), host.getProperty('ownerDocument')])
         if (innerText === undefined) {
            console.warn('innerText is undefined, falling back to textContext. It is not recommended to run accessible name assertions in Node or JSDOM environments. Do not trust these results.')
            innerText = textContent.trim().split(/\n/).map((line: string) => line.trim()).join(' ')
         }
         const accessibleName = getComputedLabel(tagName, innerText, attributes, children, document)
         const matchesImplicitRole = role === getImplicitRole(tagName, attributes, children, accessibleName)
         const match = matchesRole || matchesImplicitRole
         if (match && options.name) {
            return matchText(getComputedLabel(tagName, innerText, attributes, children, document), options.name)
         }
         return match
      }
   )
}

// @todo replace with something more comprehensive
function getComputedLabel(tagName: string | null, innerText: string | null, attributes: NamedNodeMap, children: HTMLCollection | null, document: Document | null) {
   // The element's `aria-labelledby
   const ariaLabelledby = attributes.getNamedItem('aria-labelledby');
   if (ariaLabelledby) {
      const ariaLabelledbyElement = document?.getElementById(ariaLabelledby.value);
      if (ariaLabelledbyElement) {
         const ariaLabelledbyElementText = ariaLabelledbyElement.innerText;
         if (ariaLabelledbyElementText) return ariaLabelledbyElementText;
      }
   }

   // The element's `aria-label`
   const ariaLabel = attributes.getNamedItem("aria-label");
   if (ariaLabel) return ariaLabel.value;

   // If it's an image/etc., alternate text
   // Even if it's an empty alt attribute alt=""
   if (
      tagName === "APPLET" ||
      tagName === "AREA" ||
      tagName === "IMG" ||
      tagName === "INPUT"
   ) {
      const altText = attributes.getNamedItem("alt")?.value;
      if (altText) return altText;
   }

   // <desc> for SVGs
   if (tagName === "SVG") {
      const descElt = Array.from(children ?? []).find(el => el.tagName === "DESC");
      if (descElt) {
         const descText =
            (<HTMLElement>(<unknown>descElt)).innerText || descElt.innerHTML;
         if (descText) return descText;
      }
   }

   // The value of the element
   return innerText
}

function getImplicitRole(tagName: string | null, attributes: NamedNodeMap, parentElement: Element | null, accessibleName: string | null) {
   switch (tagName) {
      case "AREA":
      case "A": {
         const href = attributes.getNamedItem('href')
         return href ? 'link' : 'generic'
      }
      case "WBR":
      case "VIDEO":
      case "VAR":
      case "TRACK":
      case "TITLE":
      case "TEMPLATE":
      case "SUMMARY":
      case "STYLE":
      case "SOURCE":
      case "SLOT":
      case "SCRIPT":
      case "RUBY":
      case "RT":
      case "RP":
      case "PICTURE":
      case "PARAM":
      case "OBJECT":
      case "NOSCRIPT":
      case "META":
      case "MARK":
      case "MAP":
      case "LINK":
      case "KBD":
      case "LABEL":
      case "LEGEND":
      case "IFRAME":
      case "HEAD":
      case "FIGCAPTION":
      case "EMBED":
      case "DT":
      case "DL":
      case "DD":
      case "COL":
      case "COLGROUP":
      case "CANVAS":
      case "CITE":
      case "BR":
      case "BASE":
      case "AUDIO":
      case "ABBR": {
         return null
      }
      case "OPTGROUP":
      case "FIELDSET":
      case "DETAILS":
      case "ADDRESS": {
         return "group"
      }
      case "ARTICLE": {
         return "article"
      }
      case "ASIDE": {
         return "complementary"
      }
      case "U":
      case "SPAN":
      case "SMALL":
      case "Q":
      case "PRE":
      case "I":
      case "HGROUP":
      case "DIV":
      case "DATA":
      case "BODY":
      case "BDO":
      case "BDI":
      case "B": {
         return "generic"
      }
      case "BLOCKQUOTE": {
         return "blockquote"
      }
      case "BUTTON": {
         return "button"
      }
      case "CAPTION": {
         return "caption"
      }
      case "CODE": {
         return "code"
      }
      case "DATALIST": {
         return "listbox"
      }
      case "S":
      case "DEL": {
         return "deletion"
      }
      case "DFN": {
         return "term"
      }
      case "DIALOG": {
         return "dialog"
      }
      case "EM": {
         return "emphasis"
      }
      case "FIGURE": {
         return "figure"
      }
      case "FOOTER": {
         return isDescendantOf(parentElement, ["article", "complementary", "main", "navigation", "region"])
            ? 'generic'
            : 'contentinfo'
      }
      case "FORM": {
         return "form"
      }
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
         return "heading"
      }
      case "HEADER": {
         return isDescendantOf(parentElement, ["article", "complementary", "main", "navigation", "region"])
            ? 'generic'
            : 'banner'
      }
      case "HR": {
         return "separator"
      }
      case "HTML": {
         return "document"
      }
      case "IMG": {
         const altText = attributes.getNamedItem('alt')
         return altText == null || altText.value !== ""
            ? "img"
            : "presentation"
      }
      case "INPUT": {
         const type = attributes.getNamedItem("type")?.value
         switch (type) {
            case "checkbox": {
               return "checkbox"
            }
            case "week":
            case "time":
            case "password":
            case "hidden":
            case "file":
            case "datetime-local":
            case "date":
            case "color": {
               return null
            }
            case "submit":
            case "reset":
            case "image": {
               return "button"
            }
            case "number": {
               return "spinbutton"
            }
            case "radio": {
               return "radio"
            }
            case "range": {
               return "slider"
            }
            case "search": {
               const list = attributes.getNamedItem("list")
               return list ? "searchbox" : "textbox"
            }
            default: {
               const list = attributes.getNamedItem("list")
               return list ? "combobox" : "textbox"
            }
         }
      }
      case "INS": {
         return "insertion"
      }
      case "LI": {
         return isChildOf(parentElement, ['list'])
            ? 'listitem'
            : 'generic'
      }
      case "MAIN": {
         return "main"
      }
      case "UL":
      case "OL":
      case "MATH": {
         return "math"
      }
      case "MENU": {
         return "list"
      }
      case "METER": {
         return "meter"
      }
      case "NAV": {
         return "navigation"
      }
      case "OPTION": {
         return "option"
      }
      case "OUTPUT": {
         return "status"
      }
      case "P": {
         return "paragraph"
      }
      case "PROGRESS": {
         return "progressbar"
      }
      case "SEARCH": {
         return "search"
      }
      case "SECTION": {
         return accessibleName
            ? 'section'
            : 'generic'
      }
      case "SELECT": {
         const multiple = attributes.getNamedItem('multiple')
         const size = attributes.getNamedItem('size')?.value ?? 0
         return multiple || size > 1
            ? 'listbox'
            : 'combobox'
      }
      case "STRONG": {
         return "strong"
      }
      case "SUB": {
         return "subscript"
      }
      case "SUP": {
         return "superscript"
      }
      // this one is lowercase
      case "svg": {
         return "graphics-document"
      }
      case "TABLE": {
         return "table"
      }
      case "TBODY": {
         return "rowgroup"
      }
      case "TEXTAREA": {
         return "textbox"
      }
      case "TFOOT": {
         return "rowgroup"
      }
      case "THEAD": {
         return "rowgroup"
      }
      case "TIME": {
         return "time"
      }
      case "TH": {
         const scope = attributes.getNamedItem('scope')?.value
         if (isDescendantOf(parentElement, ['table'])) {
            switch (scope) {
               case "row":
               case "rowheader": {
                  return "rowgroup"
               }
               case "col":
               case "columnheader": {
                  return "columnheader"
               }
               default: {
                  return 'cell'
               }
            }
         } else if (isDescendantOf(parentElement, ['grid', 'treegrid'])) {
            switch (scope) {
               case "row":
               case "rowheader": {
                  return "rowgroup"
               }
               case "col":
               case "columnheader": {
                  return "columnheader"
               }
               default: {
                  return 'gridcell'
               }
            }
         } else {
            return null
         }
      }
      case "TD": {
         if (isDescendantOf(parentElement, ['table'])) {
            return 'cell'
         } else if (isDescendantOf(parentElement, ['grid', 'treegrid'])) {
            return 'gridcell'
         } else {
            return null
         }
      }
      case "TR": {
         return "row"
      }
   }

   return null
}

function isDescendantOf(parentElement: Element | null, allowedRoles: AriaRole[]): boolean {
   if (parentElement) {
      const parentRole = getImplicitRole(parentElement.tagName, parentElement.attributes, parentElement.parentElement, '')
      return allowedRoles.some(role => role === parentRole) || isDescendantOf(parentElement.parentElement, allowedRoles)
   }
   return false
}

function isChildOf(parentElement: Element | null, allowedRoles: AriaRole[]): boolean {
   if (parentElement) {
      const parentRole = getImplicitRole(parentElement.tagName, parentElement.attributes, parentElement.parentElement, '')
      return allowedRoles.some(role => role === parentRole)
   }
   return false
}
