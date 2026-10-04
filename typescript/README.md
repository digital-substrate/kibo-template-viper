# typescript — the package a model generates, over @digitalsubstrate/dsviper

The `typescript` templates render one ES module package per model, over the
[`@digitalsubstrate/dsviper`](https://www.npmjs.com/package/@digitalsubstrate/dsviper) Node
binding (`>=1.2.14 <1.3.0`). This page says what a developer finds in it. The examples use
the laboratory's model (`devkit-codegen-test`, the `features` site): a namespace `Demo`, a
structure `StructureS`, a concept `ConceptA`.

## What the package holds

```
package.json, tsconfig.json   # the Package feature; `tsc -p .` builds src/ into dist/
src/index.ts                  # definitions(), AnyConceptKey, AnyValue, Key, the containers,
                              # and each unit as a namespace: demo
src/containers.ts             # one class per container shape the model uses: Vector_of_uint8, …
src/demo/                     # one directory per DSM namespace: Demo is demo
    data.ts                   # structures, enumerations, keys, and the runtime ids
    attachments.ts            # one class per concept, one attachment accessor per attachment
src/pools.ts, src/tools/      # the pools, rendered with the Pool feature
src/_codegen/                 # the runtime every generated package carries (see below)
```

The package exports `.`, `./pools` and every directory (`features/demo`). A pool is reached
through `features/pools`: the entry module belongs to `Base` and cannot import what only the
`Pool` feature renders. Names keep the DSM spelling (`docUInt8`, `f_E`); namespaces and pool
modules are snake_case (`demo`, `player_model`), as in Python.

## Using it from a project

The package imports `@digitalsubstrate/dsviper`, and so does any code that opens a database
or builds a runtime value. Both must reach the same installation: make the runtime a
dependency of the project, in the range the package's `package.json` declares, so that one
copy serves both. Two copies of the native binding cannot share a process — the second one
to load stops with a message naming both (`npm ls @digitalsubstrate/dsviper` finds them).

Type-checking needs the package's own settings — ES modules resolved the Node way, default
imports of a CommonJS binding: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`,
`"esModuleInterop": true`, `"types": ["node"]`, as the generated `tsconfig.json` has them. A
bare `tsc --strict file.ts` uses other defaults and fails on the binding's import.

## The bridge, and what is shared

A generated class is a box around one Viper value, with the API of the class it faces; it
holds nothing else, and every write reaches the runtime, so the runtime's fail-fast is
inherited. The bindings follow Viper's reference semantics:

```ts
import dsviper from "@digitalsubstrate/dsviper";
import { definitions, demo, Vector_of_uint8 } from "features";

const s = new demo.StructureS({ f_float: 1.5, f_string: "hello" });
const v = new Vector_of_uint8([1, 2, 3]);
const key = demo.ConceptAKey.create();

const value = s.unwrapValue();                    // the Viper value, not a copy
const same = demo.StructureS.wrapValue(value);    // over that value: a change shows in s
const boxed = new demo.StructureS(value);         // a constructor boxes a value too
const copied = new demo.StructureS(value.copy());  // a copy is explicit
```

A field read is live, a field write keeps the object it is given, and a constructor given a
Viper value boxes it. Copied instead: a set element and a map key, and a document crossing a
database. Any other copy is yours to make, explicitly: `copy()`, or a constructor given
`value.copy()`.

A few things are TypeScript's own:

- **Keys in a native `Set` or `Map`** compare by identity, as every object does there; key
  them by `key.hashKey()`, a `bigint` equal for equal keys, or use the generated
  `Set_of_…` / `Map_of_…`.
- **An enumeration** is a union of its case names with a companion object:
  `demo.EnumerationE.B` is `"b"`, `EnumerationE.unwrapValue(e)` its Viper value,
  `EnumerationE.index(e)` its position.
- **An optional** is emptied with `clear()`: `v.f_optional.clear()` empties the field. In an
  init object, an `undefined` field means "not given".
- **64-bit integers** are `bigint`.

## Storing documents

An attachment operation takes the store it acts on. A `Database` holds the current state:

```ts
const db = dsviper.Database.createInMemory();
db.extendDefinitions(definitions());               // the model, once
db.beginTransaction();
demo.attachments.ConceptA.properties.set(db, key, new demo.StructureV({ f_string: "stored" }));
db.commit();
demo.attachments.ConceptA.properties.get(db, key).unwrap().f_string;   // "stored", a copy
```

A `CommitDatabase` keeps every commit; its writes, the field operations included, go through
a `CommitMutableState` and are stored once it is committed (`commitMutations`), or through a
`CommitStore`, which adds undo and redo.

## Errors

The package follows the binding's three layers. An argument of another kind throws
`TypeError` — a Viper value of another type, a key of another concept, a variant read as an
alternative it does not hold. Native content that does not fit the type throws `ViperError`,
naming the element at fault: `300` for a `uint8`, a string for a `float` field, a structure of
another type in a list. An operation the runtime refuses throws `ViperError` too: `remove` of
an element a vector does not hold, `unwrap()` of a nil optional. An index past the end throws
the binding's `RangeError` named `ViperError`, which is not an instance of `ViperError`.

## The runtime

`src/_codegen/` — the proxy base, the container views, the attachment accessor, the registry
— is copied into every generated package from `runtime/`. It is this pack's, not the
binding's, and it documents itself: its JSDoc is the reference for the bridge, the containers
and the stores.
