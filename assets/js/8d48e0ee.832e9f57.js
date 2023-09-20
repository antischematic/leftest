"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[575],{3905:(e,t,r)=>{r.d(t,{Zo:()=>c,kt:()=>m});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function s(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?s(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):s(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function p(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},s=Object.keys(e);for(n=0;n<s.length;n++)r=s[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(n=0;n<s.length;n++)r=s[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var i=n.createContext({}),l=function(e){var t=n.useContext(i),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},c=function(e){var t=l(e.components);return n.createElement(i.Provider,{value:t},e.children)},u="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},f=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,s=e.originalType,i=e.parentName,c=p(e,["components","mdxType","originalType","parentName"]),u=l(r),f=a,m=u["".concat(i,".").concat(f)]||u[f]||d[f]||s;return r?n.createElement(m,o(o({ref:t},c),{},{components:r})):n.createElement(m,o({ref:t},c))}));function m(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var s=r.length,o=new Array(s);o[0]=f;var p={};for(var i in t)hasOwnProperty.call(t,i)&&(p[i]=t[i]);p.originalType=e,p[u]="string"==typeof e?e:a,o[1]=p;for(var l=2;l<s;l++)o[l]=r[l];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},4480:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>i,contentTitle:()=>o,default:()=>d,frontMatter:()=>s,metadata:()=>p,toc:()=>l});var n=r(7462),a=(r(7294),r(3905));const s={sidebar_position:1},o="Cypress",p={unversionedId:"adapters/cypress",id:"adapters/cypress",title:"Cypress",description:"This adapter is stable.",source:"@site/docs/adapters/cypress.md",sourceDirName:"adapters",slug:"/adapters/cypress",permalink:"/leftest/docs/adapters/cypress",draft:!1,editUrl:"https://github.com/antischematic/leftest/tree/main/packages/create-docusaurus/templates/shared/docs/adapters/cypress.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Context",permalink:"/leftest/docs/guide/context"},next:{title:"Playwright",permalink:"/leftest/docs/adapters/playwright"}},i={},l=[{value:"Setup",id:"setup",level:2},{value:"Include or exclude tests",id:"include-or-exclude-tests",level:2}],c={toc:l},u="wrapper";function d(e){let{components:t,...r}=e;return(0,a.kt)(u,(0,n.Z)({},c,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"cypress"},"Cypress"),(0,a.kt)("admonition",{type:"info"},(0,a.kt)("p",{parentName:"admonition"},"This adapter is stable.")),(0,a.kt)("h2",{id:"setup"},"Setup"),(0,a.kt)("p",null,"Install Leftest with the Cypress adapter."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-bash"},"npm add @antischematic/leftest-cypress\n")),(0,a.kt)("p",null,"Then import ",(0,a.kt)("inlineCode",{parentName:"p"},"@antischematic/leftest-cypress")," in your support file."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// support/e2e.ts\nimport "@antischematic/leftest-cypress"\n')),(0,a.kt)("h2",{id:"include-or-exclude-tests"},"Include or exclude tests"),(0,a.kt)("p",null,"Features, scenarios or examples can be included or excluded for a test run. For example, to run tests that are tagged with ",(0,a.kt)("inlineCode",{parentName:"p"},"mobile")," but exclude tests that are tagged ",(0,a.kt)("inlineCode",{parentName:"p"},"iphone")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-bash"},"TAGS=mobile,^iphone cypress run\n")),(0,a.kt)("p",null,"To enable this feature, add the ",(0,a.kt)("inlineCode",{parentName:"p"},"LEFTEST_TAGS")," entry to your cypress config"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import { defineConfig } from "cypress"\n\nexport default defineConfig({\n   env: {\n      // Set this\n      LEFTEST_TAGS: process.env.TAGS,\n   },\n})\n')),(0,a.kt)("p",null,"All tests will run if no tags are specified."))}d.isMDXComponent=!0}}]);