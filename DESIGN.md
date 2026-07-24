# kibo-template-viper — design & rationale

This note records the **why** behind the `kibo-template-viper` templates: the one
principle that shapes every generated SDK — the **Dual Reality** (§1) — and the invariants
a maintainer must preserve when editing a `.stg`. It is a design memo, not a tutorial — the
detail lives in the `.stg` files; this explains *why they are shaped that way*.

The **principle** (§1) is target-neutral and covers all three surfaces: C++ (`cpp/`),
Python (`python/package/`) and Node/TypeScript (`typescript/`). It also states, once and
concretely, **why the three surfaces look different** — the form each takes per language
(§1.2). The **detailed realization** from §2 on is the **Python / TypeScript** proxy
templates; the C++ surface appears here at the principle and form level, and its
per-template detail is a separate note (see *Open directions*).

For the consumer-facing view (how to *use* the generated SDK) see the user docs
`devkit-doc/source/kibo-template-viper/index.md`; for the templates' public-contract and
versioning status see [`README.md`](README.md#public-contract).

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
  holds one runtime `Value` and delegates** every operation to it (`vpr_value` /
  `vprValue`). No parallel native state: the object *is* a typed view onto the
  `Value`.
- **C++** (the runtime is a native library) — the native object is a **real struct
  with native fields**, and an explicit **static codec** (`cpp/ValueCodec`:
  `ValueEncoder` / `ValueDecoder`) crosses `struct ⇄ Value` at the boundaries. A
  second *representation* (native fields), but never a second *implementation* —
  the codec delegates type identity and serialization to the runtime.

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
| native object | `class S final` with native fields | `class S(Proxy)` holding `vpr_value` | `class S extends Proxy` holding `vprValue` |
| what it stores | native member fields | one wrapped runtime `Value` | one wrapped runtime `Value` |
| bridge to runtime | explicit codec `ValueEncoder`/`ValueDecoder` | hold the `Value`, delegate every op | hold the `Value`, delegate every op |
| field access | public member `s.field` | `@property` + setter | get/set accessors |
| construct from runtime | `ValueDecoder::decode(value)` | overloaded `__init__` | `static wrap()` / `cast` |
| enum | native `enum class` | proxy + `classproperty` cases | proxy + `static` members |
| collections | native STL (`std::vector`/`set`/`map`/`optional`) | proxy + dunder protocol | proxy + `Symbol.iterator` / methods |
| equality / order | `operator==` / `operator<` / `hash()` | `__eq__` / `__lt__` / `__hash__` | `equals()` / `compareTo()` |
| attachments | nested `namespace` group | flat module functions | one grouped object |
| namespace | literal `namespace` (real scope) | `<Ns>_<Name>` symbol prefix | `<Ns>_<Name>` symbol prefix |

The pattern is one axis: **C++ is a thick native static layer + an explicit codec**;
**Python and Node are a thin static view + continuous delegation.** C++ can hold native
typed data cheaply, so it does (structs, `enum class`, STL, public fields, operators) and
crosses to the dynamic `Value` only at the codec boundary. Python and Node cannot — the
dynamic `Value` is the only currency — so the native object is a thin proxy over it,
delegating on every call. C++ is not an outlier by accident: it diverges *because its binding
allows a native representation*, and Python/Node converge *because their bindings share the
same dynamic constraint*.

This gives the rule that separates **idiom from drift**. A cross-target difference that lives
in the static surface and follows the host language's idiom — a native `enum class` vs a
proxy, STL vs the dunder protocol, a `namespace` vs flat module functions — is
**legitimate**: the same meaning written in each language's grammar. A difference that changes
the **dynamic** semantics — a different operation, a different argument order, a value that is
not the runtime's — is a **bug**. Everything below serves this test.

### 1.3 The one invariant, in Python & TypeScript

This memo details the Python / TypeScript realization, where the bridge is "hold one value
and delegate". The invariant that enforces it: **every proxy wraps exactly one runtime value
and delegates every operation to it.**

- Python: `Proxy.__slots__ = ["vpr_value"]`
- TypeScript: `readonly vprValue: V`

If an edit ever makes a proxy hold something other than a single runtime value, or bypass it,
the Dual Reality is broken on these surfaces. This invariant is the whole design of the
Python/TS templates; everything below serves it.

A corollary the templates enforce: constructors are **fail-fast**. A struct proxy `raise`s
`TypeError` when `value.type() != mt.type<Suffix>()`; a key proxy validates the concept
before wrapping. Use a `raise`, never an `assert` — an `assert` is stripped under
`python -O`, which would silently drop the check in optimized runs. A wrong value is rejected
at construction, not deferred.

## 2. What the generator consumes and emits

The template model object `m` exposes:

- `m.namespace`, `m.generated` — identity/provenance for the file header.
- `m.nameSpaces` — the **named** types, grouped by DSM namespace. Each namespace
  carries `.concepts`, `.clubs`, `.enumerations`, `.structures`, `.attachments`.
- `m.vecFunctions`, `m.matFunctions`, `m.tupleFunctions`, `m.optionalFunctions`,
  `m.vectorFunctions`, `m.setFunctions`, `m.mapFunctions`, `m.xarrayFunctions`,
  `m.variantFunctions` — the **structural** (anonymous) types, held **globally**,
  deduplicated across the whole model. A `set<B>` has no namespace, so it cannot
  be grouped under one; this is why `data.py` loops `m.nameSpaces` for named
  types but iterates these lists globally.
- `m.functionPools` — function-pool definitions.

Emitted package (one module per concern; the split is deliberate):

| Module | Role | Surface |
|---|---|---|
| `data` | proxy classes for every type | **public** — the types you import |
| `attachments` | free functions: get/set/enumerate an attachment from state | **public** — the mutation verbs |
| `function_pools` | classes wrapping a `FunctionPool` (one method per function) | public (only if the model declares pools) |
| `function_pool_remotes`, `attachment_function_pools`, `attachment_function_pool_remotes` | RPC / attachment-pool variants of the above | public (when applicable) |
| `database_attachments` | typed database-attachment helpers | public (when applicable) |
| `definitions` | the type catalog (`definitions()`), `RuntimeIds`, `AttachmentRuntimeIds` | plumbing |
| `value_type` | memoized `type…()` / `type_check…()` factories returning runtime `Type` handles | plumbing |
| `path` | `Path_Root` + `<Namespace>_Path_<Struct>` field-path constants | plumbing |
| `resources` | the base64/zlib-packed definitions blob decoded by `definitions()` | plumbing (always present) |
| `__init__` | re-exports `data` (`from .data import *`) | — |

`data` and `attachments` are the only modules a consumer imports directly; the
rest is delegated to by those two. Keeping the plumbing in separate modules is
what lets `data`/`attachments` read cleanly.

## 3. The proxy contract

Every proxy — named or structural — provides the same uniform surface, because
uniformity is what makes the generated code predictable:

- A single wrapped value (§1).
- Serialization: `encode` / `write` / `hexdigest`, and static `decode` / `read`.
- Value identity delegated to the runtime (`__eq__`/`__hash__`/ordering in
  Python; `equals`/`compareTo` in TS).
- A fail-fast constructor (§1).

One always-emitted special case: `AnyConceptKey` — the type-erased concept key,
the join point for `from_any_concept_key` / `to_any_concept_key` across the
concept hierarchy.

## 4. `wrap` / `unwrap` and the `useProxy` predicate

This is the single mechanical rule the whole codegen turns on. For any value
crossing the boundary, the templates emit one of two forms, selected by
`useProxy`:

```
unwrap(t, v) = v.vpr_value   if t.useProxy   else v      # into the runtime
wrap(t, v)   = <Type>(v)      if t.useProxy   else v      # out of the runtime
```

- **PODs pass through** — scalars and native forms (`int`, `str`, `bool`, …) are
  their own runtime representation, so `useProxy` is false and no wrapping
  happens.
- **Typed values are wrapped/unwrapped** — a proxy going into the runtime is
  unwrapped to its `vpr_value`; a runtime value coming out is wrapped in its
  proxy.

Get `useProxy` wrong for a type and you either leak a raw runtime value to the
caller (breaks §1) or feed a proxy where the runtime expects a value (runtime
error). When adding a type kind, wire its `useProxy` first.

## 5. DSM → proxy mapping

| DSM | Python / TS proxy | Shape |
|---|---|---|
| `concept C` | `<Ns>_CKey` | key proxy: `create()`, hierarchy nav, `to/from_any_concept_key` |
| `club K` | `<Ns>_KKey` | key proxy over member concepts |
| `enum E` | `<Ns>_E` | proxy; cases as `classproperty` (Py) / static (TS) |
| `struct S` | `<Ns>_S` | proxy; one property getter/setter per field |
| `vec/mat/tuple` | `Vec_… / Mat_… / Tuple_…` | fixed-shape sequence proxies |
| `optional<T>` | `Optional_<T>` | `is_nil` / `unwrap` / `get` |
| `vector/set/map/xarray<…>` | `Vector_… / Set_… / Map_… / XArray_…` | collection proxies with the idiom's collection surface |
| `variant<…>` | `Variant_…` | per-arm `is…` / `get…` / `set…` |
| `attachment<Key, Doc> a` | `<ns>_<key-concept>_<a>_…` free functions | verbs over `AttachmentGetting` / `AttachmentMutating` |

## 6. Naming conventions

The generated names are mechanical — that is intentional, because a mechanical
name in a stack trace points straight back to a line of DSM.

- **Named types:** `<Namespace>_<Type>` (e.g. `Foo_Material`).
- **Structural types:** `<Kind>_<element…>` (e.g. `Set_Foo_MaterialKey`,
  `Optional_Foo_Material`, `Vec_uint8_2`).
- **Attachment verbs:** `<namespace>_<key-concept>_<attachment>_<verb>` (e.g.
  `foo_material_properties_set`).
- **Plumbing accessors:** `mt.type<Suffix>()` / `mt.type_check<Suffix>()`,
  `md.RuntimeIds.*`, `md.AttachmentRuntimeIds.*`, `mp.<Ns>_Path_<Struct>.<field>`.

**Why the `<Namespace>_` prefix exists.** DSM namespaces are mandatory — they
disambiguate `Foo::Material` from `Bar::Material`. Target languages split in two:
those with a **lexical namespace** (C++, …) project the DSM namespace directly
onto the language namespace; those **without** one (Python, Node/TS, Ruby) have
no lexical construct to carry it, so the namespace is flattened into a **symbol
prefix** (`Foo::A` → `Foo_A`, `::` → `_`). The prefix *is* the namespace. This is
why every Python/TS symbol is prefixed even when a model has a single namespace —
see *Open directions* for the known cost of that.

## 7. Python ↔ TypeScript: parallel by design

The two surfaces are the same design in two idioms and must stay parallel — a
feature added to one is added to the other in the same change. The wrapped value
is `vpr_value` (Python) / `vprValue` (TS); everything else differs only where the
idiom demands:

| Concern | Python | TypeScript |
|---|---|---|
| storage | `__slots__ = ["vpr_value"]` | `readonly vprValue` |
| construct-from-runtime | overloaded `__init__` | `static wrap()` / `cast` |
| struct field | `@property` + setter | getter/setter accessors |
| enum case | `classproperty` | `static` member |
| collections | dunder protocol (`__iter__`, `__getitem__`, operators) | `Symbol.iterator`, methods |
| null container | `Optional_…` proxy | `Optional_…` proxy |
| attachment surface | flat module functions (`test_concept_a_properties_get(state, …)`) | one object per attachment (`conceptA_Properties.get(state, …)`) |

Divergences beyond these are drift, not idiom — treat them as bugs.

**The attachment row is a deliberate idiom split, not drift — and it is the one place
the two surfaces diverge structurally by design.** Python exposes each attachment's verbs
as **flat module-level functions** with a uniquely-prefixed name
(`<ns>_<key>_<attachment>_<verb>(state, …)`); TypeScript groups them under **one exported
object per attachment** with short verbs (`<keyAttachment>.<verb>(state, …)`), the same
grouping the C++ surface expresses as a nested namespace. Both are idiomatic to their
target — flat module functions are the Python way ("flat is better than nested"; the module
*is* the namespace), an object-as-namespace is the C++/TS way. Crucially the **operation
set is identical** — same verbs (`keys`/`diffKeys`/`has`/`get`/`set`/`diff`/`enumerate`
plus the field-level `set…`/`union…`/`subtract…`/`update…`/`insert…`/`remove…`), same
argument order (state first, then key, then value). Only the **packaging** differs. It is
recorded here so it is not mistaken for drift, and so SDK documentation presents **one verb
model with two call-form examples**, not two different attachment APIs. Reconciling the two
(grouping Python, or flattening TS) would be a generated-surface change and belongs to a
future major line, not the maintenance line — and neither form is a bug, so there is no
correctness reason to force it.

### Why a `.ts` template reads `pythonType.proxy`

Both surfaces read the model through a per-entity `pythonType` accessor —
`<e.pythonType.proxy>`, `<sf.pythonType.type>`, and the `useProxy` predicate behind
`wrap`/`unwrap` (§4). The name predates the TypeScript surface, but its members are
**language-neutral generated identifiers**, not Python — with exactly one exception:

- `.proxy` — the generated class name (`Set_Foo_Bar`, `Foo_MaterialKey`). Identical on
  both surfaces; this is why a `.ts` template legitimately writes `<e.pythonType.proxy>`.
- `.useProxy` — the POD-passthrough predicate (§4). Pure logic.
- `.type` — the scalar *leaf* spelling (`int`, `str`, `None`, `dsviper.ValueBlob`). **This
  member alone is Python.**

So the TypeScript templates read `.proxy` and `.useProxy` freely but **never**
`pythonType.type`; they resolve scalar leaves with their own `tsType()` dictionary
(`boolean`, `number`, `bigint`, `string`, `void`, …). Reaching for `<x.pythonType.type>`
in a `.ts` template would emit a Python spelling (`str`, `None`) into TypeScript — a bug.

A parallel trap lives on the **structural** container objects (`vec`/`set`/…): their bare
`.type` is the **C++** spelling (`std::set<…>`), while `.dsmType` is the neutral DSM
spelling (`set<…>`). In Python and TypeScript comments/docstrings use `.dsmType`, never
`.type`. Same rule both times: `.proxy`, `.useProxy` and `.dsmType` are language-neutral;
every other type-spelling accessor — `pythonType.type` (Python leaves), a structural
`.type` (C++) — belongs to one specific target and must not cross into another.

**Why the accessor keeps the name `pythonType` (deferred by design, not inertia).**
Renaming it to something neutral (`scalarType`) is a change to the **model API that every
template author reads** — first- and third-party alike — so it is a coordinated change to
the code generator, tracked for a future generator release rather than done piecemeal on
the maintenance line. The decisive point is that the rename would leave the **generated
output byte-identical**: only the accessor's spelling changes, never the strings it
returns. With no functional difference to buy, there is nothing to rush — the maintenance
line keeps `pythonType` as the stable model API and reads it correctly per the rule above.
This section is what tells a template author, when the neutral accessor eventually lands,
that the two are the same handle under two names.

## 8. Changing a template safely

1. Preserve §1: the type must still hold exactly one runtime value and delegate.
2. Wire `useProxy` (§4) before anything else for a new type kind.
3. Apply the change to **both** Python and TypeScript in the same commit (§7).
4. Regenerate the codegen test and diff the output; the generated package is a
   build artifact — never hand-edit downstream output to compensate.
5. A change that alters the generated **surface** (names, module shape, imports)
   is a public-contract change and tracks the API line per
   [`README.md`](README.md#public-contract) — it does not belong on a
   feature-locked maintenance branch.

## 9. Open directions

- **Submodule per DSM namespace (non-lexical targets).** The `<Namespace>_`
  prefix (§6) is a stand-in for a missing lexical namespace, and in the common
  **single-namespace** SDK (drivers, one-domain business logic) it is pure noise:
  `Foo_MaterialStandardKey` / `foo_material_standard_properties_set` where
  `MaterialStandardKey` / `material_standard_properties_set` would read better. A
  more idiomatic strategy would emit **one Python submodule per DSM namespace**
  (a namespace built from module-dict chaining), enabling `from ns import *` in
  the single-namespace case and clean `ns.Symbol` access in the multi-namespace
  case — the same applies to TypeScript's module system. This requires reworking
  the codegen strategy for non-lexical-namespace languages and every template
  that loops `<m.nameSpaces:…>`. DSM guarantees definitions are acyclic across
  namespaces, so the resulting inter-module imports are topologically orderable.
  This changes the generated import surface, so it is future work on the trunk,
  not a maintenance-branch change.
- **C++ surface design.** The C++ target is covered here at the **principle and form**
  level (§1, §1.2): it realizes the same Dual Reality by a thick native representation plus
  an explicit codec. Its **per-template detail** — the header/source split, pass-by
  qualifiers, movability, the `ValueCodec`/`ValueType` machinery — is a different projection
  and deserves its own design note; it is not covered below.
