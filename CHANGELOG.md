# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

These are first-party Kibo templates. Changes to the generated C++, Python or
TypeScript surface — new projections, renamed outputs, or behavioural shifts
in what is generated — are tracked here.

This repository's version is its own — it is a product, and its number says nothing
about what it sits between. Those are declared, and every generated file carries the
same declarations in its header:

| | |
|---|---|
| **consumes** | Template Model 2, exposed by kibo |
| **cpp target** | the `viper` C++ runtime 1.2 |
| **python target** | `dsviper` 1.2 |
| **typescript target** | `@digitalsubstrate/dsviper` 1.2 (floor `>=1.2.8`) |

A release of this pack is driven by its **targets**: a projection appears because a
binding gained something to project. The Template Model it consumes moves on kibo's
own cadence and is a floor, not a co-version — that this pack is at `2.0.0` while it
consumes Template Model 2 is a **coincidence, not a rule**.

They used to track the Viper runtime contract instead. Two things made that the wrong
number to carry it. The generated surface and the runtime are the two sides of one design
(`DESIGN.md` §1) and they do not move at the same rate: this repository and the generator
keep changing to serve whoever reads the generated code — names, ergonomics, what is
projected at all — while the runtime is locked across a minor by contract and is not
expected to move. And the three targets never agreed on a runtime version anyway, since
each binding versions its patch stream independently. One number could not carry both
sides, so it now carries the one that moves.

Which runtime each target is generated against is stated where it belongs: the README's
compatibility table, and — since 2.0.0 — the header of every generated file.
The templates are not published on their own: consumers vendor this repository
and package it themselves, and the `cpp/`, `python/` and `typescript/`
directories move together as one snapshot. Which runtime version each directory
targets is in the README's compatibility table.

Kibo and these templates were distributed as one thing until `1.2.0`, the first
standalone release, and have moved on separate patch streams since. Their
numbers are therefore not interchangeable: the same Kibo jar renders different
output from different template versions, and what a generated file reports —
`Generated from … by kibo-X.Y.Z.jar` — names the generator alone. A consumer
that repackages both into a single artefact should not read that artefact's
version as either one.

## [2.0.0] - 2026-09-10

Requires **kibo 2.0**; these templates do not render against an earlier generator. The
runtime they target is unchanged — `viper` / `dsviper` 1.2.x, and
`@digitalsubstrate/dsviper` `>=1.2.8 <2.0.0` — and is now named, with its version, in the
header of every generated file.


Two C++ template defects, the delegating templates losing every lookup table they carried,
and the TypeScript remote calls losing two workarounds the binding never needed. Generated
output changes in the two prototype names named below and in the remote-call lines.
**Requires a kibo that carries the binding vocabularies.**

### Changed

- **Remote calls stop encoding their arguments, and stop casting their result.** Every
  generated TypeScript remote call wrapped each argument — `new dsviper.ValueInt64(a)` —
  and cast the result through `as unknown as dsviper.OutputValue`. Both date from the
  TypeScript port, when the call path was worked out by probing, and neither was revisited
  as the binding's typings settled.

  Neither is needed at the declared floor. In `node-v1.2.8`, `ServiceRemoteFunction::Call`
  marshals each argument through `checkValue(env, arg, parameters[i].type)`, which takes a
  wrapped value or coerces the native one against the type the prototype declares — every
  integer width, bigint for the 64-bit ones, strings, and even a string into a uuid, a
  commit id or a blob id. And 1.2.8 already declares
  `call(...args: InputValue[]): OutputValue`, so there is nothing to cast.

  Calls now read `call(a, b)`, and a proxy argument still passes its `vprValue`. Verified
  by type-checking the generated `service` package against the published
  `@digitalsubstrate/dsviper@1.2.8`: clean.

- **Comments, docstrings, reprs and exception messages name the DSM type.** They named
  three different spaces at once: containers used the DSM spelling, entities the C++ one
  (`Test::ConceptAKey`), and a variant member the binding one (`int`, `Test_StructureS`) —
  in the same generated file.

  All of them guard a runtime type comparison, and a runtime type is a DSM type; the DSM
  name is also what the author wrote in the `.dsm`, and it reads the same in all three
  targets. So `identifier is not a Test::ConceptAKey` becomes `… a Test::ConceptA`,
  `# concept Test::ConceptAKey` becomes `# concept Test::ConceptA`, and the doubled key in
  `[A proxy class for a key<Test::ConceptAKey>]` is gone.

  It is also more precise: a variant member of DSM type `uint8` reported
  `variant does not hold a int` in Python and `a number` in TypeScript, so two members of
  different widths raised indistinguishable errors. No model in the codegen test has such
  a variant, so this was latent.

  Type positions are untouched — they still use the target's own spelling.

- **The templates no longer spell types; they read them.** Both delegating surfaces used
  to carry their own lookup tables — `tsLeaf` and `valueCtor` on the TypeScript side, and
  the Python one reaching back into the generator for the same thing. Thirteen copies of
  two tables across thirteen files, plus the helpers that walked them.

  The generator now states them, once per target, and the templates read `bindingType.type`
  for how this target writes a type, `bindingType.valueConstructor` for the runtime value
  class to build on the way in, and `bindingSequenceType` / `bindingColumnType` for the
  fixed-size containers. Accessors follow the rename: `bindingType`, `bindingElementType`,
  `bindingKeyType`, `bindingMembers`, `returnBindingType`.

  `wrap`, `unwrap`, `dtype` and `valueEncode` remain, because choosing between `d.X` and
  `X`, or between `X.wrap(v)` and `new dsviper.ValueInt64(v)`, depends on the file and the
  idiom rather than on the type. What is gone is every table and every rewriting of a type
  inside a template — the register the C++ templates have always been written in.

  One thing this fixes on the way: `vec` and `mat` hard-coded `number[]` and `number[][]`
  in TypeScript whatever their element, which would have been wrong for a `vec<string, 2>`.
  They now render the element's own spelling. No model in the codegen test has such a vec,
  so generated output is unchanged.

## [1.2.4] - 2026-09-10

Two C++ template defects, both surfaced by the render diagnostics kibo now prints.
The Python and TypeScript surfaces are unchanged.

### Fixed

- **A key proxy's docstring counted the key twice.** It read
  `[A proxy class for a key<Test::ConceptAKey>]`, wrapping `key<…>` around a name that
  already ended in `Key`. The docstring named the entity through `getType()`, which for a
  concept or a club is the C++ key type; the Template Model carried no DSM spelling for an
  entity to reach for instead. Kibo now provides one, and the docstring reads
  `key<Test::ConceptA>`.

  Requires kibo with `getDsmType()` on concepts and clubs. Only this docstring changes —
  comments and messages keep naming entities as they did, since moving those to the DSM
  name is a change of convention rather than a defect, and belongs to 1.3.

- **A `vec` or `mat` of 64-bit integers was typed as `number[]` in TypeScript.** The
  element spelling was written into the templates rather than derived: the constructor
  parameter, `toArray`, `row` and `setRow` all said `number[]` whatever the element. A
  `vec` takes only numeric DSM types, so most of them are `number` and the mistake was
  invisible — but `int64` and `uint64` cross the Node binding as `bigint`, and the
  binding says so: `ValueVec.toArray()` returns `NumericOutputValue[]`, which is
  `number | bigint`.

  The generated code narrowed that with `as number[]`, so TypeScript accepted arithmetic
  on values that arrive as `bigint` and the mismatch surfaced only at run time, as
  `Cannot mix BigInt and other types`. A cast hid it from the compiler; nothing else
  would have caught it.

  The four spellings now derive from the element, so `vec<int64, 2>` renders `bigint[]`.
  No model in the codegen test declares a 64-bit `vec`, so generated output is unchanged
  and the fix is shown on a probe model.

- **An attachment's xarray `remove` function was registered under a truncated name,
  and two of them collided.** The helper that builds these names takes the structure
  field; one of its twenty-one call sites passed the field's *name* instead, so
  inside the helper the property lookup ran against a string and resolved to nothing.
  The generated C++ class kept its correct name while the prototype it registered
  lost the field: `..._remove_` where its siblings read `..._insert_f_xarray` and
  `..._update_f_xarray`.

  The consequence is not cosmetic. Every xarray field of one attachment document
  produced the *same* truncated name, and the runtime rejects a duplicate — it throws
  `alreadyRegisteredFunctionName`. A document carrying two xarray fields therefore
  generated code that could not register its attachment pool at all. The codegen test
  fixture is exactly that shape, and compiles the generated sources without
  registering the pool, which is why this went unseen.

- **A conditional include in `FunctionPoolRemotes.cpp` could never fire.** It was
  guarded by `m.usePrototypeData`, which the Template Model does not carry and never
  has, so the guard was always false. Nothing was missing from the output: the
  generated header already includes the data header unconditionally, and the source
  includes that header. The dead guard is removed; generated output is unchanged.

## [1.2.3] - 2026-09-08

`AnyConceptKey` becomes usable as a key in the standard unordered containers,
which its interface had promised all along. The generated C++ header declared
`hash()` and `operator==` on the type but never emitted the matching `std::hash`
specialisation, so `std::unordered_map<Ns::AnyConceptKey, V>` did not compile.
Purely additive: no signature changes, no on-disk format change, no runtime
contract change, and nothing that compiled before compiles differently now.

The generation header that opens every generated file also stops saying the same
thing three different ways, and the TypeScript barrel gains the runtime and
licence notice its Python counterpart already carried.

### Fixed

- **`std::hash<Ns::AnyConceptKey>` was never generated.** The header emits a
  specialisation for every concept, club and structure key, driven by the
  `concepts`, `clubs` and `structures` lists. `AnyConceptKey` belongs to none of
  them — it is written out on its own, ahead of the namespaces — and so was
  skipped. An unspecialised `std::hash` is disabled rather than defined, so the
  omission surfaces as a compile error at the first `unordered_map` or
  `unordered_set` keyed by the type: diagnosable and loud, unlike the 1.2.2
  defect, but it left the type unusable in the one place its `hash()` accessor
  exists for. The specialisation is now emitted unconditionally, since the class
  itself is generated unconditionally.

  *For generated SDKs* — additive. Hand-written code that compiled keeps
  compiling; code that could not compile now can, once regenerated. No
  regeneration is needed by anyone not reaching for that specialisation.

  `AnyConceptKey` was the only type in the C++ surface declaring `hash()` and
  `operator==` without a `std::hash` specialisation; none remain.

- The `// MARK: - std::hash for STL unordered container compatibility.` banner
  was emitted once per non-empty group, so a generated header could carry it up
  to three times. It now appears once, above the whole block.

### Changed

- **The generation header wraps identically across the three languages.** Its
  runtime paragraph names a different artefact per target — the `viper` C++
  runtime, `dsviper`, `@digitalsubstrate/dsviper` — and that is the only part
  that should differ. The rest was already word for word the same, but the line
  breaks were not: C++ ended each line on a clause boundary, while Python and
  TypeScript split `Commercial use / requires a Commercial Licence` mid-phrase.
  All three now follow the C++ breaks. No wording change, no line added or
  removed; 19 templates touched, and the C++ tree is untouched.

### Added

- **The generated `index.ts` now carries the runtime and licence notice.** The
  TypeScript barrel opened with the stamp alone, while its Python counterpart
  `__init__.py` carried the full notice — the same file in the same role, saying
  two different things about what it pulls in. Neither names the runtime in its
  own body; both re-export the whole SDK, so the runtime follows them. The
  notice now says so in both.

  The rule the tree follows is otherwise intact: a generated file carries the
  runtime paragraph when it reaches for the runtime. The two manifests keep the
  short header — `pyproject.toml` and `tsconfig.json` reference nothing — and
  `package.json` stays without a header at all, npm parsing it as strict JSON.

## [1.2.2] - 2026-08-31

A memory-safety fix in the C++ stream surface, and a gap closed in what the
generated manifests declare about themselves. `Reader` and `Writer` held their
stream by reference where every call site passes a pointer to a derived type,
so the reference bound to a converted temporary that died at the end of the
constructor. It is undefined behaviour rather than a diagnosable error, and it
reaches every generated C++ SDK built from `1.2.1` or earlier: regeneration is
the only cure, and waiting for a crash is not a plan.

No signature changes, no on-disk format change, and no runtime contract change,
so hand-written call sites are unaffected. The generated `pyproject.toml` and
`tsconfig.json` gain the header every other generated file already carried;
their content is otherwise unchanged.

### Fixed

- **`Reader` and `Writer` held their stream by reference, and it dangled.** The
  members were declared `std::shared_ptr<Viper::StreamReading> const &` (and
  likewise `definitions`, `streamWriting`), while every call site passes a
  pointer to a derived type — `createDecoder` returns
  `shared_ptr<StreamDecoding>`, `createEncoder` returns
  `shared_ptr<StreamEncoding>`, and `StreamDecoding` derives from
  `StreamReading`. That conversion is not an identity, so the compiler
  materialises a converted `shared_ptr` temporary, binds the reference to it,
  and destroys it at the end of the constructor's full-expression. Every read
  through the member afterwards is a use of a dead stack slot. The members are
  now values; the constructor parameters stay `const &`, so the initialiser
  lists copy instead of binding — one refcount pair per `Reader` or `Writer`,
  both short-lived stack objects built once per encode or decode.

  *For generated SDKs* — no signature changes, so hand-written call sites are
  unaffected. But any SDK generated before this carries the defect and only
  regeneration clears it. It is undefined behaviour, not a diagnosable error:
  the reused stack frame often still holds a plausible pointer, so a decoder
  can appear to work for a long time before it stops. Anyone shipping generated
  C++ from an earlier snapshot should regenerate rather than wait for a crash.

  Caught by `test_codec` in devkit-codegen-test, which segfaulted in
  `Reader::read_float()`. AddressSanitizer places the fault far earlier, at the
  first `Reader` constructed anywhere — `stack-use-after-scope` in
  `ValueDecoder::decode_vec2_uint8`, reading the unnamed temporary two slots
  above the `decoder` it was converted from.

  These were the only members declared by reference anywhere in the template
  set, of any type; none remain.

### Added

- **The generated `pyproject.toml` and `tsconfig.json` now name the template
  version.** Every other generated file already opened with `Templates:
  kibo-template-viper X.Y.Z (MIT)`; these two did not, and the Python
  manifest's header named neither the model nor the generator. That stamp is
  how someone holding generated code decides whether a fix applies to their
  SDK, so a file omitting it is a file that cannot answer the question. The
  generated `package.json` stays the one exception, and by necessity: npm
  parses it as strict JSON, which has no comment syntax.

## [1.2.1] - 2026-08-28

The C++ write direction stops asking the compiler to resolve what the generator
already knows, and the fuzz harness gains the two entry points no model had ever
required. Breaking for hand-written code that calls the codec, hasher or digest
functions; generated call sites update by regeneration alone. The read
direction, the on-disk format and the runtime contract are unchanged.

Pairs with Kibo 1.2.11, which makes anticipated container types a per-target
decision — this release removes the C++ surface's last use of them. Generated
files now name both versions.

### Changed

- **Breaking — the C++ write direction now names its target type.** Every
  function in `Writer`, `DataHasher`, `ValueEncoder`, `ValueHexdigest` and
  `JsonEncoder` carries the suffix of the type it operates on, mirroring the
  read direction (`Reader`, `ValueDecoder`, `JsonDecoder`, `ValueType`), which
  already did. `writer.write(value)` becomes `writer.write_Ns_Type(value)`,
  `ValueEncoder::encode(value)` becomes `ValueEncoder::encode_Ns_Type(value)`,
  and likewise for `hash` and `hexdigest`. The same-named overload sets are
  gone, and the primitive entry points are renamed to match (`write_string`,
  `hash_uint32`, `encode_uuid`, …). See DESIGN.md §6.1 for the rule and its
  rationale.

  *For generated SDKs* — hand-written code calling these functions must name
  the type. Generated call sites are updated by regeneration alone. The read
  direction, the on-disk format and the runtime contract are unchanged.

  *For modified templates* — 21 `.stg` files are touched, across `cpp/Stream`,
  `cpp/Data`, `cpp/ValueCodec`, `cpp/ValueHasher`, `cpp/Json`,
  `cpp/Attachments`, `cpp/Database`, `cpp/FunctionPool*` and `cpp/Test`. A fork
  carrying local edits there should expect conflicts wherever a `write`,
  `encode`, `hash` or `hexdigest` call appears.

  The motivation is compile time. Resolving a call against N same-named
  overloads makes the compiler prove non-viability for every discarded
  candidate, and a `std::optional<T>` parameter turns each such proof into a
  full constraint evaluation instead of an immediate mismatch — quadratic in
  the number of generated types, and severe enough on some standard-library
  implementations to dominate the build.

- The C++ surface no longer emits any hand-written function template. The
  `hash(std::array<T, n>)` helper is gone, replaced by an explicit nested loop
  in the `mat` hasher that computes the same value.

- **The remote attachment `get` prototype builds its return type in place.**
  It read `ValueType::type_optional_<document>()`, a generated accessor that
  exists only because Kibo registers an `optional` derived type per attachment
  document. It now calls `Viper::TypeOptional::make(ValueType::type_<document>())`
  directly, which is what that accessor did internally.

  This was the C++ surface's only use of those derived types, and removing it
  lets Kibo skip them for a native binding (see its 1.2.11 entry) — the C++ arm
  builds attachment containers element by element and needs nothing else. The
  Python and TypeScript arms still wrap them in proxy classes and are unaffected.
  The prototype declared to the runtime is unchanged, and it is built once per
  attachment at pool registration, never on a hot path.

- **Generated files now name the template version that produced them.** The
  header read `Templates: MIT (kibo-template-viper)` and named no version, so a
  generated file identified its generator (`by kibo-X.Y.Z.jar`) but not the
  templates — the half that determines most of what is emitted. It now reads
  `Templates: kibo-template-viper 1.2.1 (MIT)`, in all three targets.

  Until the header block is factored out, that string is repeated in every
  `.stg` and must be bumped at each release. The block is copied verbatim into
  93 files, which is the same reason the licence lines cannot be corrected in
  one place either.

### Fixed

- `DataHasher`: the hasher for a `set` computed its result and then returned
  `0`, so a structure drew no hash information from its set fields and collided
  with every structure differing only in set contents. Generated sets are
  `std::set`, hence ordered, so the element-wise combination is well defined;
  it is now returned. Hash values change for any structure carrying a set
  field — they are in-memory only and never persisted.

- **`TestFuzz::fuzz_bool` was declared but never defined, and `fuzz_uint8`
  carried its body.** A single copy-paste produced three defects: `fuzz_bool`
  was declared returning `std::uint8_t` instead of `bool`, no definition of it
  existed, and `fuzz_uint8` drew from the boolean generator and decoded through
  `decode_bool`. A model with a `bool` attachment document failed to compile —
  brace-initialising a `bool` from a `std::uint8_t` narrows — and would have
  failed to link. The third defect was silent and universal: `fuzz_uint8`
  produced only 0 and 1 for every model, weakening that generator without
  breaking anything.

- **`TestFuzz::fuzz_commit_id` did not exist.** `blob_id` and `uuid` had fuzz
  functions in both harness layers; `commit_id` had been left out of both. Any
  model declaring an attachment whose document is a `commit_id` failed to
  generate a compilable test harness.

## [1.2.0] - 2026-06-17

First standalone release of the first-party Kibo templates for the Viper
ecosystem (the Viper C++ runtime and the `dsviper` Python binding),
consumed by Kibo to generate typed C++ and Python API surfaces.

### Added
- `cpp/` — C++ surface templates (Data, Database, Stream, Json,
  Attachments, FunctionPool, value codecs/types/hashers) targeting the
  Viper C++ API.
- `python/` — Python surface templates targeting the `dsviper` API.
