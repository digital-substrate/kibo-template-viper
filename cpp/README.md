# cpp — the code a model generates, over the Viper C++ runtime

The `cpp` templates render C++17 over the `viper` C++ runtime and its static layer
(`Viper_StaticType`, `Viper_StaticWriter`, `Viper_StaticReader`, `Viper_StaticHash`, on its
`LTS-1.2` branch). The generated C++ is the base reference of this pack: the Python and
TypeScript packages offer what it offers, with its restrictions. The examples use the
laboratory's model (`devkit-codegen-test`, the `features` site).

## What is generated

A namespace is a file-name prefix and a C++ namespace: `Demo` in the infrastructure
`features` gives `features_demo_data.hpp` and `features::demo`. Which files a project renders
is `../features.json`, resolved by `../resolve.py`:

| feature | files | what it holds |
|---|---|---|
| `Base` | `<ns>_<unit>_data`, `_model`, `_codec`, `<ns>_codec`, `<ns>_any_concept`, `<ns>_resources` | structures, enumerations, keys; their identity in the definitions; the bridge to a `Value` |
| `Fields` | `<ns>_<unit>_fields` | every field's name, for code that goes through the dynamic API |
| `Paths` | `<ns>_<unit>_paths` | every field's path, built once from its name |
| `DatabaseAttachments` | `<ns>_<unit>_database_attachments` | the CRUD usage: per attachment, `keys`, `has`, `get`, `set`, `del` over a `Viper::Database` |
| `CommitAttachments` | `<ns>_<unit>_commit_attachments` | the Commit usage: per attachment, `keys`, `has`, `get` over a state; `set`, `diff` and the field mutations over an `CommitAttachmentMutating` |
| `Reads` | `<ns>_<unit>_reads` | the reading usage: per attachment, `keys`, `has`, `get` over an `AttachmentGetting`, whatever holds the documents; nothing writes |
| `Pool` | `<ns>_<pool>_pool` | a function pool: the functions an application implements, and the pool it exposes |
| `PoolRemote` | `<ns>_<pool>_remote` | the same pool, called through a service |
| `AttachmentPool` | `<ns>_<pool>_attachment_pool` | an attachment pool: the functions over a Commit state an application implements, and the pool |
| `AttachmentPoolRemote` | `<ns>_<pool>_attachment_remote` | the same attachment pool, called through a service |

## Value semantics

The C++ types are values: a structure is a `struct` with a default constructor and one
taking every field, a key is a `final` class (`create()` mints one, `ConceptAKey()` is the
invalid key), and copying copies. They cross to a Viper `Value` through the codec, which
copies too:

```cpp
#include "features_codec.hpp"        // the bridge, for every namespace of the model
#include "features_demo_database_attachments.hpp"
#include "Viper_Database.hpp"

using namespace features;

demo::StructureS s(1.5, "hello");
auto const value{codec::encode(s)};                        // a Viper::ValueStructure
auto const back{codec::decode<demo::StructureS>(value)};   // equal to s
auto const h{std::hash<demo::StructureS>{}(s)};            // Viper::StaticHash underneath

auto const key{demo::ConceptAKey::create()};
auto const db{Viper::Database::createInMemory()};
db->extendDefinitions(codec::definitions());
db->beginTransaction(Viper::DatabaseTransactionMode::Deferred);
demo::database_attachments::ConceptA::properties::set(db, key, demo::StructureV{});
db->commit();
```

A key widens to its parent's by an implicit conversion or `toParentKey()`, and narrows with
`Child::from(anyConceptKey)` — or `parent.asChildKey()` for a child declared in the parent's
namespace, which a parent can name; every key gives `toAny()` / `toAnyConceptKey()`. JSON, XML and a hexdigest are one runtime call on what `encode` returns;
the pack generates the bridge, not what composes it with a runtime feature.

## Attachments and pools

Viper has two databases that share nothing, and an attachment is generated once per usage, each
with its own operations only:

- `DatabaseAttachments`, the CRUD usage: `<ns>::<unit>::database_attachments::<Concept>::<attachment>`,
  whose `keys`, `has`, `get` read a `Viper::Database` and whose `set`, `del` write it whole, inside a
  transaction. Nothing of Commit.
- `CommitAttachments`, the Commit usage: `<ns>::<unit>::commit_attachments::<Concept>::<attachment>`,
  whose `keys`, `has`, `get` read a state (an `AttachmentGetting`) and whose `set`, `diff` and field
  mutations (`setName`, `unionVertexKeys`, …) emit mutations on an `CommitAttachmentMutating`.

- `Reads`, the reading usage: `<ns>::<unit>::reads::<Concept>::<attachment>`, whose `keys`, `has`,
  `get` take any `AttachmentGetting` -- a `Viper::Database` read as it is, or a Commit state -- and
  nothing writes. For code that consumes documents without knowing the source, such as a library
  that applications of either database compile: it reads through `Reads`, and never chooses a
  usage for its applications. It requires `Base` only, and neither usage requires it: an
  application asks for it beside its own usage when it compiles such a library.

A pool is a namespace, `<ns>::<pool>`: the application implements its functions there,
`pool()` returns the `Viper::FunctionPool` it exposes, and `poolName` / `poolId` name it.
`Remote` calls the same pool through a `Viper::ServiceRemote`; most projects do not expose
their pools as a service, and a client links without the functions only a server implements.
An attachment pool is the same over a Commit state (`AttachmentPool`, `AttachmentPoolRemote`),
and requires `CommitAttachments`.

## Tests of the generator

The templates that test the generator itself — every type round-tripped through the codec,
every attachment through a database, every pool through the bridge — live with the
laboratory, `devkit-codegen-test`, and are not part of the pack.
