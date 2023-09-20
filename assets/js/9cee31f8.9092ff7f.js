"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[506],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>g});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?s(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):s(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},s=Object.keys(e);for(a=0;a<s.length;a++)n=s[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(a=0;a<s.length;a++)n=s[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),p=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u=function(e){var t=p(e.components);return a.createElement(l.Provider,{value:t},e.children)},c="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,s=e.originalType,l=e.parentName,u=o(e,["components","mdxType","originalType","parentName"]),c=p(n),d=r,g=c["".concat(l,".").concat(d)]||c[d]||m[d]||s;return n?a.createElement(g,i(i({ref:t},u),{},{components:n})):a.createElement(g,i({ref:t},u))}));function g(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var s=n.length,i=new Array(s);i[0]=d;var o={};for(var l in t)hasOwnProperty.call(t,l)&&(o[l]=t[l]);o.originalType=e,o[c]="string"==typeof e?e:r,i[1]=o;for(var p=2;p<s;p++)i[p]=n[p];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},4117:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>m,frontMatter:()=>s,metadata:()=>o,toc:()=>p});var a=n(7462),r=(n(7294),n(3905));const s={sidebar_position:3},i="Steps",o={unversionedId:"guide/steps",id:"guide/steps",title:"Steps",description:"This API is stable.",source:"@site/docs/guide/steps.md",sourceDirName:"guide",slug:"/guide/steps",permalink:"/leftest/docs/guide/steps",draft:!1,editUrl:"https://github.com/antischematic/leftest/tree/main/packages/create-docusaurus/templates/shared/docs/guide/steps.md",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"tutorialSidebar",previous:{title:"Features",permalink:"/leftest/docs/guide/features"},next:{title:"Context",permalink:"/leftest/docs/guide/context"}},l={},p=[{value:"Add a basic step",id:"add-a-basic-step",level:2},{value:"Add a parameterised step",id:"add-a-parameterised-step",level:2},{value:"Passing in arguments",id:"passing-in-arguments",level:3},{value:"Using inline values",id:"using-inline-values",level:3},{value:"Passing in arguments through examples",id:"passing-in-arguments-through-examples",level:3},{value:"Using an alias",id:"using-an-alias",level:3},{value:"Common steps",id:"common-steps",level:2}],u={toc:p},c="wrapper";function m(e){let{components:t,...n}=e;return(0,r.kt)(c,(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"steps"},"Steps"),(0,r.kt)("admonition",{type:"info"},(0,r.kt)("p",{parentName:"admonition"},"This API is stable.")),(0,r.kt)("p",null,"The step file should be initially created as an empty object. As you work on features you will implement each step here. These should match the steps defined by ",(0,r.kt)("inlineCode",{parentName:"p"},"given"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"when"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"then"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"and")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"but")," methods in the feature file."),(0,r.kt)("h2",{id:"add-a-basic-step"},"Add a basic step"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"export default {\n   'the Maker starts a game': () => {\n      console.log('Maker started the game')\n   }\n}\n")),(0,r.kt)("p",null,"The implementation details of the step are test framework specific. It is up to you to decide what each step does."),(0,r.kt)("h2",{id:"add-a-parameterised-step"},"Add a parameterised step"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"export default {\n   'I eat <eat> cucumbers': (amount: number) => {\n      console.log(`I ate ${amount} cucumbers`)\n   }\n}\n")),(0,r.kt)("p",null,"Steps are parameterised using angle brackets ",(0,r.kt)("inlineCode",{parentName:"p"},"<>")," to delimit the name of the variable. There are multiple ways to use a parameterised step."),(0,r.kt)("h3",{id:"passing-in-arguments"},"Passing in arguments"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"when('I eat <eat> cucumbers', 10) \n")),(0,r.kt)("h3",{id:"using-inline-values"},"Using inline values"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"when('I eat [10] cucumbers') // 10 is parsed as a number\nwhen('I eat \"10\" cucumbers') // 10 is parsed as a string\n")),(0,r.kt)("p",null,"Arguments are parsed as strings when delimited with single or double quotes ",(0,r.kt)("inlineCode",{parentName:"p"},'""')," or ",(0,r.kt)("inlineCode",{parentName:"p"},"''"),", and as literal values when delimited with square brackets ",(0,r.kt)("inlineCode",{parentName:"p"},"[]"),"."),(0,r.kt)("h3",{id:"passing-in-arguments-through-examples"},"Passing in arguments through examples"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"when('I eat <eat> cucumbers')\nexamples([\n   { eat: 5 },\n   { eat: 10 },\n]) \n")),(0,r.kt)("h3",{id:"using-an-alias"},"Using an alias"),(0,r.kt)("p",null,"To avoid naming conflicts, parameters can be renamed with an alias."),(0,r.kt)("admonition",{type:"note"},(0,r.kt)("p",{parentName:"admonition"},"Aliased parameters are not type checked when used with ",(0,r.kt)("inlineCode",{parentName:"p"},"examples"),".")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"when('I eat <munch> cucumbers')\nexamples([\n   { munch: 5 },\n   { munch: 10 },\n]) \n")),(0,r.kt)("h2",{id:"common-steps"},"Common steps"),(0,r.kt)("p",null,"Steps for common operations like user authentication or page navigation can be extracted into a common steps file."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"export default {\n   'I login with <username> and <password>': (username: string, password: string) => {\n      console.log('login:', username, password)\n   },\n   'I visit <page>': (page: string) => {\n      console.log('visit:', page)\n   }\n}\n")),(0,r.kt)("p",null,"Steps can be easily combined using the spread operator."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import commonSteps from \"./common\"\n\nexport default {\n   ...commonSteps,\n   'the Maker starts a game': () => {\n      console.log('Maker started the game')\n   }\n}\n")))}m.isMDXComponent=!0}}]);