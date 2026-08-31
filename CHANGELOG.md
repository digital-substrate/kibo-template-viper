# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

These are first-party Kibo templates. Changes to the generated C++, Python or
TypeScript surface — new projections, renamed outputs, or behavioural shifts
in what is generated — are tracked here.

`MAJOR.MINOR` track the Viper runtime contract; `PATCH` is this repository's own
stream, independent of the runtime, the `dsviper` wheel and the Node binding.
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
