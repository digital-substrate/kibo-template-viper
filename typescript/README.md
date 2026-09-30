# typescript — flat, like the pack

A namespace is a **module directory**, as in Python: `Core::Colour` reaches a consumer as
`import { Colour } from 'pkg/core'`.

The container views return a `globalThis.Proxy` from their constructor so unknown properties
forward to the underlying value — the JS counterpart of `__getattr__`, written that way
because it is the only form that keeps `instanceof` working.

## The package files

The `Package` feature writes `package.json` and `tsconfig.json` at the package root; the
sources stay in `src/`, and `tsc` builds them into `dist/`. It is the counterpart of Python's
`Wheel`.

## The runtime

`_codegen/` is copied into every generated package from `runtime/`, and is
the template pack's, as in Python.

## Open

- **The `.d.ts` surface has not been judged from outside**: no `exports` map, no ESM/CJS
  decision, and `tsc --strict` has only ever run on code generated and consumed inside this
  repository.
