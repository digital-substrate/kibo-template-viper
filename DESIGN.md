# kibo-template-viper — design & rationale

This note records the **why** behind the `kibo-template-viper` templates: the one
principle that shapes every generated SDK — the **Dual Reality** (§1) — and the invariants
a maintainer must preserve when editing a `.stg`. It is a design memo, not a tutorial — the
detail lives in the `.stg` files and the runtime; this explains *why they are shaped that way*.

The **principle** (§1) is target-neutral and covers all three surfaces: C++ (`cpp/`),
Python (`python/`, with its runtime in `python/runtime/`) and Node/TypeScript
(`typescript/`, with `typescript/runtime/`). It also states, once and concretely, **why the
three surfaces look different** — the form each takes per language (§1.2). The sections
after it cover what the generator hands a template and what the pack emits (§2), the
runtime the Python and TypeScript packages carry (§3–§4), and the C++ static layer (§6).

For the consumer-facing view (how to *use* the generated SDK) see
<https://docs.digitalsubstrate.io/kibo-template-viper/>; for the templates' public-contract
and versioning status see [`README.md`](README.md#public-contract).

## 1. The Dual Reality — a static surface over a dynamic runtime

The whole point of the generated code is one principle: **expose static, typed,
native-language objects — for developer ergonomics and IDE completion — over a
dynamic, `Value`-based runtime.** The runtime (Viper for C++, dsviper for Python
and Node) is *dynamic*: it deals in runtime `Value`s whose type identity is checked
at run time, against `Definitions`. The generated SDK is the *static* veneer above
it — the same value, seen twice: once as an opaque runtime `Value` (the dynamic
reality), once as a typed native object (the static reality the developer edits
against). This holds for **all three targets**; only the **bridge** between the two
layers differs:

- **Python / Node** (dynamic bindings) — the native object is a **thin handle that
  holds one runtime `Value` and delegates** every operation to it (`unwrap_value()` /
  `unwrapValue()`). No parallel native state: the object *is* a typed view onto the
  `Value`: a box, with the API of the class it faces. The bindings follow the runtime's
  reference semantics and implement no value semantics: `wrap_value` / `wrapValue` and a
  constructor given a Viper value both box it, without copying; natives given to a
  constructor become a new value through the runtime's seamless conversion; a copy is the
  user's, explicitly (`Cls(value.copy())`, `p.copy()`).
- **C++** (the runtime is a native library) — the native object is a **real struct
  with native fields**, and an explicit **static codec** — a generated `write` / `read`
  per type over the runtime's static layer (§6) — crosses `struct ⇄ Value` at the
  boundaries. A second *representation* (native fields), but never a second
  *implementation* — the codec delegates type identity and serialization to the runtime.

### 1.1 The runtime is the source of truth

The generated code is an **adapter, never a second implementation.** The strong typing and
the safety live in the **runtime**; the static surface only makes them *visible and
ergonomic at edit time* (typed classes, IDE autocompletion, per-type methods). It must never
re-implement runtime logic — type identity, serialization, storage and validation all belong
to the runtime, and the generated code delegates to them: by holding the `Value` and
delegating (Python/Node), or by encoding/decoding through the codec (C++). Everything a proxy
or a struct *does* is the runtime doing it, made typed. This is why the strong safety is not
something the templates add — they only surface it; get an edit wrong and you do not weaken a
guarantee the template owns, you *hide* a guarantee the runtime already enforces.

### 1.2 The form per target language

Because the static surface exists for the developer, its **shape is idiomatic to the host
language** — and that is *why the three surfaces look different even though they mean the same
thing*. The single variable is **how thick the static layer is**, which the binding decides:

| Concern | **C++** (native + codec) | **Python** (handle + delegate) | **Node/TS** (handle + delegate) |
|---|---|---|---|
| namespace (unit) | file-name prefix + C++ `namespace <model>::<unit>` | module directory `<pkg>/<unit>/` | module directory `src/<unit>/` |
| structure | `struct S final`, public native fields | `class S(Proxy)`, one `@property` per field | `class S extends Proxy`, get/set accessors |
| what it stores | native member fields | one runtime `Value` | one runtime `Value` |
| bridge to runtime | `codec::encode` / `codec::decode` | hold the `Value`, delegate every op | hold the `Value`, delegate every op |
| enumeration | `enum class` | `enum.Enum` whose values are the case names | a union of case-name literals + a companion object |
| containers | STL (`std::vector`/`set`/`map`/`optional`/`array`), `Viper::XArray` | generic views from the runtime: `Sequence`, `Mapping`, `Ordered` | the same views, as TS classes |
| absent optional | `std::nullopt` | `None` | `undefined` |
| equality / order | `operator==` / `operator<`, `std::hash` | `__eq__` / `__lt__` / `__hash__`, delegated | `equals()` / `hashKey()`, `compareTo()` on keys |
| attachments | `<model>::<unit>::attachments::<Concept>::<attachment>::<op>` | `<pkg>.<unit>.attachments.<Concept>.<attachment>.<op>` | `<unit>/attachments`: `<Concept>.<attachment>.<op>` |

The pattern is one axis: **C++ is a thick native static layer + an explicit codec**;
**Python and Node are a thin static view + continuous delegation.** C++ can hold native
typed data cheaply, so it does (structs, `enum class`, STL, public fields, operators) and
crosses to the dynamic `Value` only at the codec boundary. Python and Node cannot — the
dynamic `Value` is the only currency — so the native object is a thin proxy over it,
delegating on every call. C++ is not an outlier by accident: it diverges *because its binding
allows a native representation*, and Python/Node converge *because their bindings share the
same dynamic constraint*.

Two rows are the same shape in all three targets. A DSM namespace is a **unit** — a C++
`namespace` (the file-name prefix only keeps two same-named headers apart), a Python or
TypeScript module directory — so two namespaces of one model may declare the same name. And
attachments are **grouped by the concept they are keyed on**, and the operations they
share (`keys`, `has`, `get`, `set`, `diff`, the field-level setters) carry the same names.

This gives the rule that separates **idiom from drift**. A cross-target difference that lives
in the static surface and follows the host language's idiom — a native `enum class` vs an
`enum.Enum` vs a literal union, STL vs a runtime view, `del` vs `delete` — is **legitimate**:
the same meaning written in each language's grammar. A difference that changes the
**dynamic** semantics — a different operation, a different argument order, a value that is
not the runtime's — is a **bug**. Everything below serves this test.

### 1.3 The one invariant, in Python & TypeScript

The bridge here is "hold one value and delegate". The invariant that enforces it: **every
generated class wraps exactly one runtime value and delegates every operation to it.** The
runtime's base classes make it structural:

- Python: `Proxy.__slots__ = ("_value",)`, every subclass `__slots__ = ()`; the value is
  read through `unwrap_value()`. The container `View` has the same shape.
- TypeScript: `abstract class Proxy<V extends dsviper.Value>` holds the value under a symbol
  key (`readonly [VALUE]: V`), read through `unwrapValue()`; `View` has the same shape.
  `wrapValue` adopts a value without running the constructor (`adopt` in `value.ts`), so the
  runtime classes declare no ES private (`#`) member, which an adopted object would lack.

Equality, hashing, ordering, `encode`, `hexdigest` and `copy` on the base classes are one-line
delegations to the held value. If an edit ever makes a generated class hold something other
than a single runtime value, or bypass it, the Dual Reality is broken on these surfaces.

Two deliberate exceptions, both because the host language has a better native form:
**enumerations** are not proxies — a case is a host value (its DSM case name), converted to
and from a runtime enumeration at the boundary (`_wrap` / `_unwrap` in Python, `wrap` /
`value` on the TS companion object). And the **attachment accessors** hold no value at all:
an attachment's runtime id and the definitions accessor, from which the descriptor is resolved
on first use.

A corollary the templates enforce: construction is **fail-fast**. A structure rejects a
`Value` of another type, a concept key rejects a key that is not a member of its concept, a
club key a key that designates no member, a bound container a value the runtime refuses to
build, `wrap` a runtime type whose unit has not been imported. Each is a `raise TypeError`
(Python) / `throw new TypeError` (TypeScript) — never an `assert`, which `python -O` strips,
silently dropping the check in optimized runs. A wrong value is rejected at construction,
not deferred.

## 2. What the generator exposes and what the pack emits

A template says what it is rendered for by the entries it declares: `model(m)` once for
the whole model, `unit(u)` once per DSM namespace, `pool(p)` / `attachment_pool(p)` once per
function pool — a pool is a unit too, a namespace holding only functions. Some templates
declare both `model` and `unit` (`__init__.py.stg`, `index.ts.stg`, `codec.hpp.stg`): what
belongs to one namespace goes in the unit, what no unit can claim goes in the model.

**A unit** carries `concepts`, `clubs`, `enumerations`, `structures` / `sortedStructures`,
`attachments` and `attachmentScopes` — the same attachments grouped by the concept they are
keyed on, which is what a class-scoped target needs, since two `class ConceptA` definitions
do not merge the way two C++ `namespace` blocks do. A unit's `dependencies` are split by
what reaches them — `types` (concept parents, club members, structure fields), `attachments`
(an attachment's key or document), `functions` (a pool's signatures) and their union `all`.
A template imports the dependencies of *what it emits*: `data.py` imports
`u.dependencies.types`, `attachments.py` imports `u.dependencies.attachments`. Importing
`all` would compile and be wrong.

**The model** carries what has no namespace: the **structural** types, deduplicated across
the whole model (`m.vecFunctions` … `m.variantFunctions`, one list per kind) — a `set<B>`
belongs to no unit — plus `m.nameSpaces`, the pools, and the header's identity
(`m.namespace`, `m.generated`).

**Where the output lands is the generator's**, not the project's: a Python module that says
`from .. import model_b` is right in one place only, so the layout that names the file is
the one that computed the import. C++ files go to one flat directory as
`<model>_<unit>_<template>` (unit scope) or `<model>_<template>` (model scope); Python and
TypeScript files go to `<unit>/<template>` or the package root.

**What each feature emits** (`features.json`, resolved by `resolve.py`):

| target | feature | emits |
|---|---|---|
| cpp | `Base` | `data`, `codec`, `model` per unit; the model's `codec` and `any_concept` |
| cpp | `Fields` | per unit, each field's name and path as constants |
| cpp | `Attachments` | per unit, the attachments, in memory or in a database |
| cpp | `Pool` / `PoolRemote` | a function pool, server side / client side |
| python | `Base` | `__init__.py` (root: `definitions()`; unit: re-exports `data`), `<unit>/data.py`, `<unit>/attachments.py`, `containers.py` |
| python | `Pool` | `<pool>/__init__.py`, `<pool>/pool.py` (`Pool` and `Remote`) |
| python | `Wheel` | `pyproject.toml` (project root), `py.typed` (package) |
| typescript | `Base` | `index.ts` (root: `definitions()`, re-exports `containers`; unit: re-exports `data`), `<unit>/data.ts`, `<unit>/attachments.ts`, `containers.ts` |
| typescript | `Pool` | `<pool>/index.ts`, `<pool>/pool.ts` (`Remote`) |
| typescript | `Package` | `package.json`, `tsconfig.json` |

Two things sit beside the generated code without being rendered by these templates. The
**embedded definitions** — `resources.py`, `resources.ts`, `<model>_resources.hpp` — are
written by the project; the root module decodes them once into `definitions()`. And the
**runtime**, `python/runtime/` and `typescript/runtime/`, is copied into every generated
package as `_codegen/`. That runtime belongs to this pack, not to dsviper: a proxy over a
`Value` is one exposition of the runtime among others, and it versions with the templates
that call it.

A generated file carries a header — provenance, the pack's stamp, the runtime and its
range, the licence — and the model's own documentation (`docstring` and `comment` formats).
Python and TypeScript output carries no other prose; a C++ file's header adds a short
statement of what the file holds.

The header is written once per target, in `<target>/banner.stg`, which every template
imports and calls (`<banner(m)>`, or `manifest_banner` / `configuration_banner` for a file
that is not code). Its first line is the generator's own (`m.generated`): what was rendered,
by which kibo. A third-party template writes its own header: its `Templates:` line names its
author and licence, not this pack's, and the runtime notice is the third party's to state.

## 3. The runtime the packages carry

`_codegen/` is small and generic; everything type-specific is generated.

- **`Proxy`** — the base of every generated structure and key (§1.3). **`AnyConceptKey`**,
  the type-erased concept key, lives here too: it is the join point of
  `to_any_concept_key` / `from_any_concept_key` and belongs to no unit.
- **The registry** — each unit's `data` module ends with `register(...)`, mapping the
  runtime id of every concept, club, enumeration and structure it declares to its class.
  `set_definitions` / `setDefinitions` is called once by the root module.
- **`wrap` / `unwrap`** — the only two conversions across the boundary (§4).
- **The container views** — `Sequence` (vector, set, vec, mat, tuple), `Mapping` (map),
  `Ordered` (xarray), `Optional`, `Variant`. One class serves every element type; the
  annotation carries the element (`Sequence[Colour]`, `Mapping<number, string>`). Operations
  the view does not define forward to the held value and wrap what comes back — `__getattr__`
  in Python, a `globalThis.Proxy` returned from the TS constructor, the only form that keeps
  `instanceof` working.
- **`AttachmentProxy`** — the attachment operations over `AttachmentGetting` /
  `AttachmentMutating` / `Database`, typed by generics `<Key, Document>`.

**Named containers** are bound, not generated. `containers.py` / `containers.ts` defines the
runtime `Type` of every structural type the model mentions, then binds a name to it:
`sequence_of(type…)`, `mapping_of`, `ordered_of`, `optional_of`, `variant_of`
(`sequenceOf`, … in TS). A bound class checks the type, builds the value from host data
(raising `TypeError` when the runtime refuses it) and adds `type()` and `decode`. It is
what a developer uses to *construct* a container; what a field *returns* is the generic view.

## 4. `wrap` / `unwrap`, `useProxy` and `isNamed`

This is the single mechanical rule the whole codegen turns on. `wrap` is a registry lookup
keyed by what the runtime value says it is:

```
wrap(v):  struct, enum      → the class registered for v.type()'s runtime id
          key               → the class registered for its concept's runtime id
          optional, any     → None / undefined if nil, else wrap(held)
          variant           → wrap(held)
          map / xarray      → Mapping / Ordered
          vector, set, vec, mat, tuple → Sequence
          anything else     → as is (TS: the host value, via Value.dumps)
unwrap(x): a Proxy or a View → its runtime value (a Python enum → its case name);
           lists, sets, dicts / Maps → element by element
```

A template does not call them blindly; the Template Model says when a crossing is needed:

- **`bindingType.useProxy`** — whether the type crosses as a runtime value that must be
  wrapped. False for every primitive (`bool`, integers, floats, `string`, `blob`, `uuid`,
  `blob_id`, `commit_id`, `any`), which the binding already hands over as host values. A
  field read is `wrap(self._value.at(name, encoded=False))` when true, a plain `at(name)`
  when false; a Python field write unwraps when true (TypeScript's `setField` always
  unwraps, and builds the variant a variant field needs).
- **`bindingType.isNamed`** — whether a unit declares the type (enumeration, structure,
  concept, club) rather than it being built from others. Only a named type has a class to
  pass — as the document class of an attachment, or to `._unwrap()` a Python pool
  argument.

Get `useProxy` wrong and you either leak a raw runtime value to the caller (breaks §1) or
feed a host object where the runtime expects a value. `wrap` knows only the classes of units
that have been imported; the `TypeError` it raises otherwise is the signal.

## 5. Naming conventions

The generated names are mechanical — that is intentional, because a mechanical name points
straight back to a line of DSM.

- **Units:** the namespace in lower snake case — the Python/TS module directory
  (`model_a`), the C++ namespace segment (`<model>::model_a`) and the file-name segment.
- **Types:** the model's own casing, without prefix — the unit carries the namespace.
  Concepts and clubs add `Key` (`MaterialKey`).
- **Python:** fields, methods and attachments in snake_case (`f_bool`, `set_f_bool`,
  `properties_int_8`); enumeration cases in UPPER_SNAKE, whose values are the DSM names;
  runtime-id constants in UPPER_SNAKE.
- **TypeScript:** fields keep the model's name with a lower-case first letter; methods and
  attachments in lowerCamel (`setF_bool`, `propertiesInt8`, `instanceId`).
- **C++:** operations in lowerCamel (`instanceId`, `toAny`, `setF_bool`), fields and
  attachments as written in the model, enumeration cases with an upper-case first letter; a
  keyword gets a trailing underscore (`union_`).
- **Attachment groups:** the concept's name, or `<Namespace>_<Concept>` when the concept is
  declared in another namespace, so that adding an attachment never renames another.

## 6. The C++ surface: the runtime's static layer, found by ADL

The generated C++ crosses to a `Value`, and hashes, through the runtime's **static layer** —
`Viper_StaticType`, `Viper_StaticWriter`, `Viper_StaticReader`, `Viper_StaticHash`. The
layer answers for the vocabulary types (primitives, `UUId`, `Blob`, …) and composes every
container (`std::vector`, `std::set`, `std::map`, `std::optional`, `std::array`,
`Viper::XArray`, …) as templates. The generated code answers for the types the model
declares, each unit in its own namespace:

- `void write(Writer &, T const &)` and `T read(Reader &, tag<T>)` in `<unit>_codec`;
- `type(tag<T>)` and `valueOf(tag<T>)` in `<unit>_model`;
- `void hash(Hasher &, T const &)` beside the type in `<unit>_data`.

Every call between them is **unqualified**, and argument-dependent lookup does the joining:
the value argument, or `tag<T>` for the directions that cannot overload on a return type,
makes `T`'s namespace associated, so a `std::map<Key, std::vector<S>>` is walked by the
layer's templates down to the generated `write` for `S`. The model-wide `codec::encode<T>` /
`codec::decode<T>` are the entry points; JSON, XML and hexdigest are one runtime call on
what `encode` returns.

The rules that follow:

- **One overload per declared type, in that type's namespace, and nothing per container
  shape.** The C++ templates read no `m.*Functions` list: the layer's templates compose what
  the model only names. An overload placed in any other namespace is invisible to ADL.
- **Call unqualified.** A qualified call — `Viper::StaticWriter::write(w, x)` — disables
  argument-dependent lookup and stops at the vocabulary types.
- **Dispatch is by exact type.** `tag<T>` has no conversions and template deduction performs
  none, so a new overload never competes with another by conversion.
- **The templates the C++ surface emits are `codec::encode` / `codec::decode` and the
  `template<> struct std::hash<…>` specializations** — the latter the sole way to hook a
  generated type into the unordered containers of the STL, delegating to
  `Viper::StaticHash::of`. No SFINAE, no other hand-written template.

## 7. Python ↔ TypeScript: parallel by design

The two surfaces are the same design in two idioms and must stay parallel — a feature added
to one is added to the other in the same change. Everything differs only where the idiom
demands:

| Concern | Python | TypeScript |
|---|---|---|
| Viper value | `unwrap_value()` over `_value`; `S.wrap_value(value)` | `unwrapValue()`; `S.wrapValue(value)` |
| construct | `S(value \| dict \| None, **fields)` (a value is boxed), `SKey(uuid \| str)` | `new S(value \| record?)` (a value is boxed), `new SKey(uuid?)` |
| structure field | `@property` + setter | get/set accessors |
| enumeration | `enum.Enum`, `from_str`, index via `E(i)` | literal union + object: `fromStr`, `index`, `unwrapValue` |
| container | `Sequence` / `Mapping` / `Ordered`, dunder protocol | same views, `Symbol.iterator` + methods |
| absent optional | `None` | `undefined` |
| equality, hash, order, display | `==`, `hash()`, `<`, `repr()` | `equals`, `hashKey`, `compare`, `toString` / `toJSON` |
| container protocol | `len()`, `in`, `contains`, `empty`, `to_list` / `to_tuple`, `items`, `v + w`, `m[c] = column` | `size` / `length`, `has`, `toArray`, `entries`, `concat`, `setColumn` |
| a value of another type | `TypeError`, from every `wrap_value` and constructor | `TypeError`, from every `wrapValue` and constructor |
| documentation | the DSM documentation on the class, the field, the attachment | the same places; a structure's, on the class, not on its `…Init` |
| attachment | `<unit>.attachments.<Concept>.<attachment>.get(getting, key)` | `<Concept>.<attachment>.get(getting, key)` |
| attachment verbs | `keys`, `has`, `get`, `enumerate`, `diff_keys`, `set`, `delete`, `diff` (`del` is a keyword) | `keys`, `has`, `get`, `enumerate`, `diffKeys`, `set`, `del`, `diff`, as the C++ |
| field-level verbs | `set_<f>`, `union_<f>`, `subtract_<f>`, `update_<f>`, `insert_<f>`, `remove_<f>` | `set<F>`, `union<F>`, `subtract<F>`, `update<F>`, `insert<F>`, `remove<F>` |
| function pool | `Pool` (local, holding `NAME` and `UUID`) and `Remote` | `Remote`; `NAME` and `UUID` are the module's |

The argument order is the same everywhere: state first, then key, then value. Divergences
beyond these rows are drift, not idiom — treat them as bugs. The function-pool row is the
one open gap (§9).

The rows were measured, not recalled: every public member of the two packages of each
laboratory site, names compared without case or underscores, and whether each carries
documentation. What is left once these rows are set aside is drift, and the laboratory's
`check.py` fails on it (`tools/parity.py`, which holds these idioms as data: a new one is
added there with its row here).

### What a template reads about a type, and what it never computes

Both surfaces read the model through a per-entity `bindingType` (a `TemplateBindingType`).
It names the **space** — how a type appears seen through the binding — and carries
everything the target needs in order to write it:

- `.annotation` — the type written in full, as a type checker needs it, from inside the
  unit in scope: `Sequence[Colour]`, `MaterialKey | None`, `bigint`.
- `.qualified` — the same annotation written from outside every unit, a type of the unit in
  scope qualified by its module too (`model_a.MaterialKey`). Needed wherever a name the unit
  declares can hide the type — the attachment group of a concept named `MaterialKey` is a
  class of that name, beside the key of `Material`.
- `.proxy` — the generated class name alone, identical across bindings. Used where a *name*
  is built rather than a type written: a bound container in `containers.*`.
- `.type` / `.typeInNamespace` — the class name (a container's bound name) or the
  binding's primitive, flat or from inside a unit. `.useProxy`, `.isNamed` — the predicates
  of §4. `.typeSuffix` — the neutral key naming a generated symbol.

Fields add `bindingKeyType` / `bindingElementType` for their elements; a `vec` exposes
`bindingSequenceType`, a `mat` that and `bindingColumnType`.

**Every spelling comes from the generator.** A template still chooses between *forms* — a
module prefix, `wrap(v)` against a plain read, `.qualified` against `.annotation` — because
those depend on the file and the idiom, not on the type. But it never rewrites a type, and it
carries no lookup table. That is kibo's contract: the converter computes the types, the
template arranges them. A dictionary in a `.stg` is the sign the contract has slipped.

This is what `--converter` selects. A delegating target is a binding style plus the
vocabulary of the binding it crosses (`BindingVocabulary` in the generator —
`PythonVocabulary`, `TypeScriptVocabulary`): how a primitive crosses (`int64` is `int` in
Python and `bigint` in TypeScript for the very same runtime `ValueInt64`) and how a
composite is annotated. Adding a target is one small class there, not a dictionary copied
into every template that needs it.

### Which space a generated name belongs to

**In a type position — a signature, an annotation, a declaration — use the target's
spelling** from `bindingType`. That is the code the reader writes and calls.

**In a `repr`, a description or an exception message — use the DSM name**
(`<Namespace>::<Name>`, or the runtime type's `representation()`). Every such message
guards a **runtime** type comparison, and a runtime type is a DSM type; the DSM name is what
the author wrote in the `.dsm`, and it is **identical across the three targets**, so the same
mismatch reads the same wherever it surfaces. The structural containers, and the members
of a tuple or a variant, therefore carry `dsmType` beside their target spellings. A
target-specific accessor must not cross into another target: `.type` on a structural
container is the C++ spelling (`std::set<…>`), not a binding's.

## 8. Changing a template safely

1. Preserve §1.3: a generated class still holds exactly one runtime value and delegates.
2. For a new type kind, wire `wrap`, `useProxy` and `isNamed` (§4) before anything else; in
   C++, its overloads in its own namespace (§6).
3. Apply the change to **both** Python and TypeScript in the same change (§7), and to the
   runtime they carry when the change reaches it.
4. Regenerate and run the laboratory, `devkit-codegen-test/check.py`, which renders every
   site and runs every suite; never hand-edit generated output to compensate. It does not
   cover an outside consumer (`pip install`, `tsc --strict`): check those by hand when the
   packaging changes. `python tools/bump_version.py --check` keeps the stamp consistent.
5. If templates move, re-measure `requires` in `features.json`: it was measured from the
   `#include` graph of the generated C++, not decided.
6. A change that alters the generated **surface** — names, module shape, imports, a
   returned type — is a breaking change of this pack (see
   [`README.md`](README.md#public-contract)) and is recorded in the CHANGELOG.

## 9. Open directions

- **The `.d.ts` surface has not been judged from outside.** No `exports` map, no ESM/CJS
  decision, and `tsc --strict` has only been run on code generated and consumed inside the
  laboratory.
- **Function-pool parity.** Python emits a local `Pool` beside `Remote`; TypeScript emits
  `Remote` only. Either TypeScript gains the local side or the reason it does not is stated
  here.
