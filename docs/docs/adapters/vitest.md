---
sidebar_position: 3
---

# Vitest

:::caution

This adapter is experimental.

:::

## Setup

Install Leftest with the Vitest adapter.

```bash
npm add @antischematic/leftest-vitest
```

Import `@antischematic/leftest-vitest` in your setup file.

```ts
import "@antischematic/leftest-vitest"
```

## Include or exclude tests

Features, scenarios or examples can be included or excluded for a test run. For example, to run tests that are tagged with `mobile` but exclude tests that are tagged `iphone`

```bash
LEFTEST_TAGS=mobile,^iphone vitest
```

All tests will run if no tags are specified.
