# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

These are first-party Kibo templates. Changes to the generated C++ or
Python surface — new projections, renamed outputs, or behavioural shifts
in what is generated — are tracked here.

## [Unreleased]

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
  It read `ValueType::type_optional_<document>()`, a generated accessor whose
  existence required Kibo to register an `optional` derived type — and with it a
  full codec, hasher and descriptor family in nine modules — for every
  attachment document type in the model. It now calls
  `Viper::TypeOptional::make(ValueType::type_<document>())` directly, which is
  what that accessor did internally. This was the sole remaining consumer of
  those derived types; Kibo stops synthesising them (see its 1.2.11 entry). On a
  model with 366 attachments the generated C++ shrinks by 12%. The prototype
  declared to the runtime is unchanged, and it is built once per attachment at
  pool registration, never on a hot path.

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
